"use client";

import { useState } from "react";
import { receptionApi } from "../../lib/api/reception";
import { LogIn, UserPlus, CheckCircle2, AlertCircle } from "lucide-react";

type Mode = "walkin" | "register";

interface Toast { type: "success" | "error"; message: string; }

export default function WalkInPage() {
  const [mode, setMode] = useState<Mode>("walkin");
  const [toast, setToast] = useState<Toast | null>(null);
  const [loading, setLoading] = useState(false);

  // Walk-in form state
  const [walkin, setWalkin] = useState({
    patient_name: "", phone: "", email: "", starts_at: "", duration_min: 60, location: "", notes: "",
  });
  // Quick register form state
  const [qr, setQr] = useState({ patient_name: "", phone: "", email: "" });

  function showToast(type: Toast["type"], message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleWalkIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await receptionApi.walkIn({
        ...walkin,
        duration_min: walkin.duration_min || 60,
      });
      if (res.data) {
        showToast("success", `Walk-in scheduled for ${walkin.patient_name}!`);
        setWalkin({ patient_name: "", phone: "", email: "", starts_at: "", duration_min: 60, location: "", notes: "" });
      } else {
        showToast("error", res.error || "Failed to schedule walk-in");
      }
    } catch {
      showToast("error", "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await receptionApi.quickRegister(qr);
      if (res.data) {
        showToast("success", `Patient "${qr.patient_name}" registered successfully!`);
        setQr({ patient_name: "", phone: "", email: "" });
      } else {
        showToast("error", res.error || "Failed to register patient");
      }
    } catch {
      showToast("error", "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700&family=Inter:wght@400;500;600&display=swap');
        .page-title { font-family:'Plus Jakarta Sans',sans-serif; font-size:24px; font-weight:700; color:#e2e8f0; letter-spacing:-0.4px; margin-bottom:4px; }
        .page-sub { font-size:13px; color:#475569; margin-bottom:28px; }
        .tabs { display:flex; gap:8px; margin-bottom:28px; background:rgba(10,10,18,0.8); padding:6px; border-radius:14px; width:fit-content; }
        .tab { padding:9px 22px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; display:flex; align-items:center; gap:7px; font-family:'Inter',sans-serif; }
        .tab.active { background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; box-shadow:0 4px 16px rgba(99,102,241,0.3); }
        .tab:not(.active) { background:none; color:#475569; }
        .tab:not(.active):hover { color:#94a3b8; }
        .form-card { background:rgba(15,15,28,0.9); border:1px solid rgba(99,102,241,0.14); border-radius:20px; padding:32px; max-width:560px; }
        .form-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .field { margin-bottom:20px; }
        .label { display:block; font-size:11px; font-weight:600; color:#64748b; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:7px; }
        .input, .textarea, select.input {
          width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(99,102,241,0.18); border-radius:11px;
          padding:12px 14px; font-size:14px; color:#e2e8f0; font-family:'Inter',sans-serif; outline:none; transition:border-color 0.2s,box-shadow 0.2s;
        }
        .input:focus, .textarea:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,0.12); }
        .input::placeholder, .textarea::placeholder { color:#334155; }
        .textarea { resize:vertical; min-height:80px; }
        .submit-btn {
          background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%); border:none; border-radius:12px;
          padding:13px 28px; font-size:14px; font-weight:600; color:#fff; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif;
          box-shadow:0 4px 20px rgba(99,102,241,0.35); transition:all 0.15s; display:flex; align-items:center; gap:8px;
        }
        .submit-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 28px rgba(99,102,241,0.45); }
        .submit-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .toast {
          position:fixed; bottom:24px; right:24px; background:rgba(15,15,28,0.95); border-radius:14px; padding:14px 20px;
          display:flex; align-items:center; gap:10px; font-size:13px; font-weight:500; z-index:999;
          box-shadow:0 8px 32px rgba(0,0,0,0.5); animation:slideIn 0.3s ease;
          border:1px solid;
        }
        .toast.success { color:#34d399; border-color:rgba(16,185,129,0.3); }
        .toast.error { color:#f87171; border-color:rgba(239,68,68,0.3); }
        @keyframes slideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      <div className="page-title">Walk-In & Registration</div>
      <div className="page-sub">Schedule a walk-in appointment or quickly register a new patient</div>

      <div className="tabs">
        <button id="walkin-tab" className={`tab ${mode === "walkin" ? "active" : ""}`} onClick={() => setMode("walkin")}>
          <LogIn size={15} /> Schedule Walk-In
        </button>
        <button id="register-tab" className={`tab ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>
          <UserPlus size={15} /> Quick Register
        </button>
      </div>

      {mode === "walkin" ? (
        <form className="form-card" onSubmit={handleWalkIn}>
          <div className="form-row">
            <div className="field">
              <label className="label">Patient Name *</label>
              <input id="walkin-name" className="input" placeholder="Full name" required value={walkin.patient_name} onChange={e => setWalkin(s => ({ ...s, patient_name: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">Phone</label>
              <input id="walkin-phone" className="input" type="tel" placeholder="+91 98765 43210" value={walkin.phone} onChange={e => setWalkin(s => ({ ...s, phone: e.target.value }))} />
            </div>
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input id="walkin-email" className="input" type="email" placeholder="patient@email.com" value={walkin.email} onChange={e => setWalkin(s => ({ ...s, email: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="field">
              <label className="label">Appointment Date & Time *</label>
              <input id="walkin-starts-at" className="input" type="datetime-local" required value={walkin.starts_at} onChange={e => setWalkin(s => ({ ...s, starts_at: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">Duration (minutes)</label>
              <input id="walkin-duration" className="input" type="number" min={15} max={240} value={walkin.duration_min} onChange={e => setWalkin(s => ({ ...s, duration_min: parseInt(e.target.value) || 60 }))} />
            </div>
          </div>
          <div className="field">
            <label className="label">Location / Room</label>
            <input id="walkin-location" className="input" placeholder="e.g. Room 3, Clinic A" value={walkin.location} onChange={e => setWalkin(s => ({ ...s, location: e.target.value }))} />
          </div>
          <div className="field">
            <label className="label">Notes</label>
            <textarea id="walkin-notes" className="textarea" placeholder="Any additional notes…" value={walkin.notes} onChange={e => setWalkin(s => ({ ...s, notes: e.target.value }))} />
          </div>
          <button id="walkin-submit" className="submit-btn" type="submit" disabled={loading}>
            <LogIn size={15} /> {loading ? "Scheduling…" : "Schedule Walk-In"}
          </button>
        </form>
      ) : (
        <form className="form-card" onSubmit={handleQuickRegister}>
          <div className="field">
            <label className="label">Patient Name *</label>
            <input id="qr-name" className="input" placeholder="Full name" required value={qr.patient_name} onChange={e => setQr(s => ({ ...s, patient_name: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="field">
              <label className="label">Phone</label>
              <input id="qr-phone" className="input" type="tel" placeholder="+91 98765 43210" value={qr.phone} onChange={e => setQr(s => ({ ...s, phone: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">Email</label>
              <input id="qr-email" className="input" type="email" placeholder="patient@email.com" value={qr.email} onChange={e => setQr(s => ({ ...s, email: e.target.value }))} />
            </div>
          </div>
          <button id="qr-submit" className="submit-btn" type="submit" disabled={loading}>
            <UserPlus size={15} /> {loading ? "Registering…" : "Register Patient"}
          </button>
        </form>
      )}
    </>
  );
}
