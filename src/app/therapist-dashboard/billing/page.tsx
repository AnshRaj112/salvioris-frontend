"use client";

import { useEffect, useState } from "react";
import { Receipt, Send } from "lucide-react";
import { tenantApi, TenantApiError, TenantInvoice, V2Patient, BillingProfile } from "../../lib/api/tenant";
import { AlertMessages } from "../Alerts";
import styles from "../TherapistDashboard.module.scss";

export default function TherapistBillingPage() {
  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [patients, setPatients] = useState<V2Patient[]>([]);
  const [profile, setProfile] = useState<BillingProfile | null>(null);
  const [patientId, setPatientId] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("Session fee");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    try {
      const [inv, pts, prof] = await Promise.all([
        tenantApi.listInvoices(),
        tenantApi.listPatients(),
        tenantApi.getBillingProfile(),
      ]);
      setInvoices(inv.data || []);
      setPatients(pts.data || []);
      setProfile(prof.data);
    } catch (e) {
      setError((e as TenantApiError).message);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await tenantApi.createInvoice({
        patient_id: patientId,
        line_items: [{ description: desc, amount: parseFloat(amount) }],
      });
      setSuccess("Draft invoice created");
      setAmount("");
      load();
    } catch (err) {
      setError((err as TenantApiError).message);
    }
  };

  const send = async (id: string) => {
    try {
      await tenantApi.sendInvoice(id);
      setSuccess("Invoice sent to patient");
      load();
    } catch (err) {
      setError((err as TenantApiError).message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "#6B4C93" }}>
        <Receipt className="h-5 w-5" /> Billing
      </h2>
      <AlertMessages error={error} success={success} />

      {profile && (
        <div className={styles.noteCard}>
          <p className="text-xs">Session fee: {profile.currency} {profile.session_fee} · GST {profile.gst_rate}%</p>
        </div>
      )}

      <form onSubmit={create} className={styles.formCard}>
        <h3 className="text-sm font-bold">Create draft invoice</h3>
        <select className={styles.input} value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
          <option value="">Select patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </select>
        <input className={styles.input} placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <input className={styles.input} type="number" step="0.01" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <button type="submit" className={styles.primaryButton}>Create draft</button>
      </form>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold">Invoices</h3>
        {invoices.length === 0 ? (
          <p className="text-xs text-slate-500">No invoices yet.</p>
        ) : (
          invoices.map((inv) => (
            <div key={inv.id} className={styles.clientCard}>
              <div>
                <h4 className="text-sm font-bold">{inv.invoice_number}</h4>
                <p className="text-xs">{inv.currency} {inv.total} · {inv.status}</p>
              </div>
              {inv.status === "draft" && (
                <button onClick={() => send(inv.id)} className={styles.smallButton}>
                  <Send className="h-3 w-3 inline" /> Send
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
