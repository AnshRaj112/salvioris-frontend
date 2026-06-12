"use client";

import { useEffect, useState } from "react";
import { patientApi, PatientApiError, PatientInvoice } from "../../lib/api/patient";
import { openRazorpayCheckout } from "../../components/RazorpayCheckout";
import styles from "../../therapist-dashboard/TherapistDashboard.module.scss";

export default function BillingPage() {
  const [invoices, setInvoices] = useState<PatientInvoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);

  const load = () => patientApi.listInvoices().then((r) => setInvoices(r.data || [])).catch((e) => setError((e as PatientApiError).message));
  useEffect(() => { load(); }, []);

  const pay = async (id: string) => {
    setPaying(id);
    setError(null);
    try {
      const order = await patientApi.payInvoice(id);
      await openRazorpayCheckout({
        keyId: order.key_id,
        orderId: order.order_id,
        amount: order.amount,
        currency: order.currency,
        invoiceId: order.invoice_id,
        onSuccess: () => {
          setPaying(null);
          load();
        },
        onError: (msg) => {
          if (msg !== "Payment cancelled") setError(msg);
          setPaying(null);
        },
      });
    } catch (e) {
      setError((e as PatientApiError).message);
      setPaying(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold" style={{ color: "#6B4C93" }}>Billing</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {invoices.map((inv) => (
        <div key={inv.id} className={styles.clientCard}>
          <div>
            <h4 className="text-sm font-bold">{inv.invoice_number}</h4>
            <p className="text-xs">{inv.currency} {inv.total} · {inv.status}</p>
          </div>
          {(inv.status === "sent" || inv.status === "overdue") && (
            <button disabled={paying === inv.id} onClick={() => pay(inv.id)} className={styles.smallButton}>
              Pay
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
