"use client";

import { useEffect, useState } from "react";
import { UserPlus, Calendar, Banknote } from "lucide-react";
import { tenantApi, TenantApiError, TenantInvoice, V2Patient } from "../../lib/api/tenant";
import { AlertMessages } from "../Alerts";
import styles from "../TherapistDashboard.module.scss";

export default function ReceptionPage() {
  const [tab, setTab] = useState<"walkin" | "register" | "payment">("walkin");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [invoiceId, setInvoiceId] = useState("");
  const [provider, setProvider] = useState("cash");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    tenantApi.listInvoices("sent").then((r) => setInvoices(r.data || [])).catch(() => {});
  }, []);

  const walkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await tenantApi.receptionWalkIn({
        patient_name: name,
        phone: phone || undefined,
        email: email || undefined,
        starts_at: new Date(startsAt).toISOString(),
        duration_min: 50,
      });
      setSuccess(`Walk-in booked. Patient ${res.data.patient_id.slice(0, 8)}…`);
      setName("");
      setPhone("");
      setEmail("");
      setStartsAt("");
    } catch (err) {
      setError((err as TenantApiError).message);
    }
  };

  const quickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await tenantApi.receptionQuickRegister({
        patient_name: name,
        phone: phone || undefined,
        email: email || undefined,
      });
      setSuccess(`Registered: ${(res.data as V2Patient).full_name}`);
      setName("");
      setPhone("");
      setEmail("");
    } catch (err) {
      setError((err as TenantApiError).message);
    }
  };

  const collect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await tenantApi.receptionCollectPayment({ invoice_id: invoiceId, provider });
      setSuccess("Payment recorded");
      setInvoiceId("");
      tenantApi.listInvoices("sent").then((r) => setInvoices(r.data || []));
    } catch (err) {
      setError((err as TenantApiError).message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold" style={{ color: "#6B4C93" }}>Reception Desk</h2>
      <AlertMessages error={error} success={success} />

      <div className="flex gap-2">
        {(["walkin", "register", "payment"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`${styles.smallButton} ${tab === t ? styles.active : ""}`}
          >
            {t === "walkin" ? "Walk-in" : t === "register" ? "Register" : "Collect payment"}
          </button>
        ))}
      </div>

      {tab === "walkin" && (
        <form onSubmit={walkIn} className={styles.formCard}>
          <h3 className="text-sm font-bold flex items-center gap-2"><Calendar className="h-4 w-4" /> Walk-in appointment</h3>
          <input className={styles.input} placeholder="Patient name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className={styles.input} placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className={styles.input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={styles.input} type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
          <button type="submit" className={styles.primaryButton}>Book walk-in</button>
        </form>
      )}

      {tab === "register" && (
        <form onSubmit={quickRegister} className={styles.formCard}>
          <h3 className="text-sm font-bold flex items-center gap-2"><UserPlus className="h-4 w-4" /> Quick register</h3>
          <input className={styles.input} placeholder="Patient name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className={styles.input} placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className={styles.input} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" className={styles.primaryButton}>Register patient</button>
        </form>
      )}

      {tab === "payment" && (
        <form onSubmit={collect} className={styles.formCard}>
          <h3 className="text-sm font-bold flex items-center gap-2"><Banknote className="h-4 w-4" /> Collect payment</h3>
          <select className={styles.input} value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} required>
            <option value="">Select invoice</option>
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>{inv.invoice_number} — {inv.total}</option>
            ))}
          </select>
          <select className={styles.input} value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>
          <button type="submit" className={styles.primaryButton}>Record payment</button>
        </form>
      )}
    </div>
  );
}
