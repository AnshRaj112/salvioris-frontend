"use client";

import { patientApi } from "../lib/api/patient";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(opts: {
  keyId: string;
  orderId: string;
  amount: number;
  currency?: string;
  invoiceId: string;
  name?: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  try {
    await loadRazorpayScript();
    if (!window.Razorpay) throw new Error("Razorpay unavailable");

    const rzp = new window.Razorpay({
      key: opts.keyId,
      amount: opts.amount,
      currency: opts.currency || "INR",
      order_id: opts.orderId,
      name: opts.name || "SALVIORIS",
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        try {
          await patientApi.verifyPayment({
            invoice_id: opts.invoiceId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          opts.onSuccess();
        } catch (e) {
          opts.onError((e as Error).message);
        }
      },
      modal: {
        ondismiss: () => opts.onError("Payment cancelled"),
      },
    });
    rzp.open();
  } catch (e) {
    opts.onError((e as Error).message);
  }
}
