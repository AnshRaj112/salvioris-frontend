"use client";

import { useEffect, useState } from "react";
import { Receipt, Send, Save, CreditCard } from "lucide-react";
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

  const [profileForm, setProfileForm] = useState({
    consultation_fee: 0,
    session_fee: 0,
    gst_rate: 18.00,
    invoice_prefix: "INV",
    currency: "INR",
    gst_number: "",
    session_fee_in_person: 0,
    session_fee_chat: 0,
    session_fee_voice: 0,
    session_fee_video: 0,
  });

  const load = async () => {
    try {
      const [inv, pts, prof] = await Promise.all([
        tenantApi.listInvoices(),
        tenantApi.listPatients(),
        tenantApi.getBillingProfile(),
      ]);
      setInvoices(inv.data || []);
      setPatients(pts.data || []);
      if (prof.data) {
        setProfile(prof.data);
        setProfileForm({
          consultation_fee: prof.data.consultation_fee || 0,
          session_fee: prof.data.session_fee || 0,
          gst_rate: prof.data.gst_rate || 18.00,
          invoice_prefix: prof.data.invoice_prefix || "INV",
          currency: prof.data.currency || "INR",
          gst_number: prof.data.gst_number || "",
          session_fee_in_person: prof.data.session_fee_in_person || 0,
          session_fee_chat: prof.data.session_fee_chat || 0,
          session_fee_voice: prof.data.session_fee_voice || 0,
          session_fee_video: prof.data.session_fee_video || 0,
        });
      }
    } catch (e) {
      setError((e as TenantApiError).message);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
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

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const res = await tenantApi.updateBillingProfile(profileForm);
      setProfile(res.data);
      setSuccess("Billing profile updated successfully");
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Billing Profile Settings */}
        <form onSubmit={updateProfile} className={styles.formCard}>
          <h3 className="text-sm font-bold flex items-center gap-1.5 text-purple-800">
            <CreditCard className="h-4 w-4" /> Billing Settings & Session Charges
          </h3>
          <p className="text-[11px] text-slate-500 mb-2">Configure pricing for each consultation format. Patients pay these amounts via Razorpay.</p>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Currency</label>
              <input className={styles.input} value={profileForm.currency} onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })} required />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">GST Rate (%)</label>
              <input className={styles.input} type="number" step="0.1" value={profileForm.gst_rate} disabled={true} style={{ opacity: 0.6, cursor: "not-allowed" }} />
              <span className="text-[9px] text-slate-500 block mt-0.5">Controlled by admin</span>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-slate-400 block mb-0.5">GST Number (Optional)</label>
              <input className={styles.input} placeholder="GSTIN" value={profileForm.gst_number} onChange={(e) => setProfileForm({ ...profileForm, gst_number: e.target.value })} />
            </div>
          </div>

          <button type="submit" className={styles.primaryButton} style={{ marginTop: "1rem" }}>
            <Save className="h-3.5 w-3.5 inline mr-1" /> Save Settings
          </button>
        </form>

        {/* Create Invoice */}
        <form onSubmit={create} className={styles.formCard}>
          <h3 className="text-sm font-bold text-purple-800">Create manual draft invoice</h3>
          <p className="text-[11px] text-slate-500 mb-2">Issue a separate billing statement to an registered patient.</p>
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
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-purple-800">Invoice Ledger</h3>
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
