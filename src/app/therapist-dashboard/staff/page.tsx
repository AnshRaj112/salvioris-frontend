"use client";

import { useEffect, useState } from "react";
import { therapistStaffApi } from "../../lib/api/reception";
import { getTenantId, getAuthToken } from "../../lib/auth/tenant";
import { Users, Plus, Trash2, RotateCcw, Eye, EyeOff, CheckCircle2, AlertCircle, Shield } from "lucide-react";

interface Receptionist {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface Toast { type: "success" | "error"; message: string; }

export default function StaffPage() {
  const [receptionists, setReceptionists] = useState<Receptionist[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  function showToast(type: Toast["type"], message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function getApi() {
    const tenantId = getTenantId();
    const token = getAuthToken();
    if (!tenantId || !token) return null;
    return therapistStaffApi(tenantId, token);
  }

  async function fetchReceptionists() {
    setLoading(true);
    try {
      const api = await getApi();
      if (!api) return;
      const res = await api.listReceptionists();
      setReceptionists(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchReceptionists(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const api = await getApi();
      if (!api) return;
      const res = await api.createReceptionist(form);
      if (res.success) {
        showToast("success", `Receptionist "${form.name}" created! Share the email & password with them.`);
        setForm({ name: "", email: "", password: "" });
        setShowForm(false);
        fetchReceptionists();
      } else {
        showToast("error", res.error || res.message || "Failed to create receptionist");
      }
    } catch {
      showToast("error", "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(id: string, name: string) {
    if (!confirm(`Deactivate "${name}"? They will no longer be able to log in.`)) return;
    try {
      const api = await getApi();
      if (!api) return;
      await api.deactivateReceptionist(id);
      showToast("success", `"${name}" has been deactivated`);
      fetchReceptionists();
    } catch {
      showToast("error", "Failed to deactivate");
    }
  }

  async function handleReactivate(id: string, name: string) {
    try {
      const api = await getApi();
      if (!api) return;
      await api.reactivateReceptionist(id);
      showToast("success", `"${name}" has been reactivated`);
      fetchReceptionists();
    } catch {
      showToast("error", "Failed to reactivate");
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        .page-title { font-family:'Plus Jakarta Sans',sans-serif; font-size:26px; font-weight:700; color:#e2e8f0; letter-spacing:-0.5px; margin-bottom:4px; }
        .page-sub { font-size:14px; color:#475569; margin-bottom:28px; }
        .toolbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
        .add-btn { background:linear-gradient(135deg,#6366f1,#8b5cf6); border:none; border-radius:12px; padding:11px 22px; font-size:13px; font-weight:600; color:#fff; cursor:pointer; display:flex; align-items:center; gap:8px; font-family:'Inter',sans-serif; box-shadow:0 4px 16px rgba(99,102,241,0.3); transition:all 0.15s; }
        .add-btn:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(99,102,241,0.4); }
        .form-card { background:rgba(15,15,28,0.95); border:1px solid rgba(99,102,241,0.22); border-radius:20px; padding:28px; margin-bottom:28px; max-width:520px; }
        .form-title { font-family:'Plus Jakarta Sans',sans-serif; font-size:16px; font-weight:700; color:#e2e8f0; margin-bottom:20px; display:flex; align-items:center; gap:8px; }
        .field { margin-bottom:18px; }
        .label { display:block; font-size:11px; font-weight:600; color:#64748b; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:7px; }
        .input-wrap { position:relative; }
        .input { width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(99,102,241,0.18); border-radius:11px; padding:12px 14px; font-size:14px; color:#e2e8f0; font-family:'Inter',sans-serif; outline:none; transition:border-color 0.2s,box-shadow 0.2s; }
        .input:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,0.12); }
        .input::placeholder { color:#334155; }
        .pw-toggle { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#64748b; padding:2px; display:flex; align-items:center; }
        .pw-toggle:hover { color:#94a3b8; }
        .form-actions { display:flex; gap:10px; margin-top:4px; }
        .submit-btn { flex:1; background:linear-gradient(135deg,#6366f1,#8b5cf6); border:none; border-radius:10px; padding:12px; font-size:13px; font-weight:600; color:#fff; cursor:pointer; }
        .cancel-btn { flex:1; background:rgba(100,116,139,0.1); border:1px solid rgba(100,116,139,0.2); border-radius:10px; padding:12px; font-size:13px; font-weight:600; color:#64748b; cursor:pointer; }
        .rec-grid { display:flex; flex-direction:column; gap:12px; }
        .rec-card { background:rgba(15,15,28,0.9); border:1px solid rgba(99,102,241,0.12); border-radius:16px; padding:20px 22px; display:flex; align-items:center; gap:20px; transition:border-color 0.2s; }
        .rec-card:hover { border-color:rgba(99,102,241,0.24); }
        .rec-card.inactive { opacity:0.55; }
        .rec-avatar { width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:700; color:#fff; font-family:'Plus Jakarta Sans',sans-serif; flex-shrink:0; }
        .rec-info { flex:1; }
        .rec-name { font-size:15px; font-weight:600; color:#e2e8f0; margin-bottom:2px; }
        .rec-email { font-size:12px; color:#475569; }
        .rec-badge { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
        .badge-active { background:rgba(16,185,129,0.12); color:#34d399; }
        .badge-inactive { background:rgba(100,116,139,0.12); color:#64748b; }
        .rec-actions { display:flex; gap:8px; }
        .icon-btn { background:none; border:1px solid rgba(99,102,241,0.15); border-radius:8px; padding:7px; cursor:pointer; color:#64748b; transition:all 0.15s; display:flex; align-items:center; }
        .icon-btn:hover { border-color:rgba(99,102,241,0.3); color:#94a3b8; }
        .icon-btn.danger:hover { border-color:rgba(239,68,68,0.3); color:#f87171; background:rgba(239,68,68,0.05); }
        .empty-msg { text-align:center; padding:60px; color:#334155; font-size:14px; }
        .toast { position:fixed; bottom:24px; right:24px; background:rgba(15,15,28,0.95); border-radius:14px; padding:14px 20px; display:flex; align-items:center; gap:10px; font-size:13px; font-weight:500; z-index:999; box-shadow:0 8px 32px rgba(0,0,0,0.5); animation:slideIn 0.3s ease; border:1px solid; }
        .toast.success { color:#34d399; border-color:rgba(16,185,129,0.3); }
        .toast.error { color:#f87171; border-color:rgba(239,68,68,0.3); }
        @keyframes slideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .info-box { background:rgba(99,102,241,0.07); border:1px solid rgba(99,102,241,0.18); border-radius:12px; padding:14px 18px; margin-bottom:24px; font-size:13px; color:#818cf8; display:flex; align-items:flex-start; gap:10px; line-height:1.5; }
        .created-at { font-size:11px; color:#334155; margin-top:2px; }
      `}</style>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      <div className="page-title">Manage Reception Staff</div>
      <div className="page-sub">Create and manage receptionist accounts for your practice</div>

      <div className="info-box">
        <Shield size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          Receptionists can access: walk-ins, appointments (full calendar), patient list, billing &amp; invoices, and referral codes (read-only).
          They <strong>cannot</strong> access clinical notes, prescriptions, wellness logs, analytics, or messages.
        </span>
      </div>

      <div className="toolbar">
        <div style={{ fontSize: 13, color: "#475569" }}>
          {receptionists.length} receptionist{receptionists.length !== 1 ? "s" : ""}
        </div>
        <button id="staff-add-btn" className="add-btn" onClick={() => setShowForm(f => !f)}>
          <Plus size={15} /> {showForm ? "Cancel" : "Add Receptionist"}
        </button>
      </div>

      {showForm && (
        <form className="form-card" onSubmit={handleCreate}>
          <div className="form-title"><Users size={16} /> New Receptionist Account</div>
          <div className="field">
            <label className="label">Full Name *</label>
            <input id="staff-name" className="input" placeholder="e.g. Priya Sharma" required value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} />
          </div>
          <div className="field">
            <label className="label">Email Address *</label>
            <input id="staff-email" className="input" type="email" placeholder="receptionist@clinic.com" required value={form.email} onChange={e => setForm(s => ({ ...s, email: e.target.value }))} />
          </div>
          <div className="field">
            <label className="label">Password *</label>
            <div className="input-wrap">
              <input
                id="staff-password"
                className="input"
                type={showPassword ? "text" : "password"}
                placeholder="Set a secure password"
                required
                value={form.password}
                onChange={e => setForm(s => ({ ...s, password: e.target.value }))}
                style={{ paddingRight: 44 }}
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPassword(p => !p)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>
              Share these credentials directly with your receptionist. They cannot be changed from the portal later.
            </p>
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
            <button id="staff-submit" className="submit-btn" type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create Account"}
            </button>
          </div>
        </form>
      )}

      <div className="rec-grid">
        {loading ? (
          <div className="empty-msg">Loading…</div>
        ) : receptionists.length === 0 ? (
          <div className="empty-msg">
            <Users size={36} color="#334155" style={{ margin: "0 auto 12px" }} />
            <p>No receptionists yet. Add one using the button above.</p>
          </div>
        ) : (
          receptionists.map(rec => (
            <div key={rec.id} className={`rec-card ${!rec.is_active ? "inactive" : ""}`}>
              <div className="rec-avatar">{rec.name.charAt(0).toUpperCase()}</div>
              <div className="rec-info">
                <div className="rec-name">{rec.name}</div>
                <div className="rec-email">{rec.email}</div>
                <div className="created-at">Added {new Date(rec.created_at).toLocaleDateString()}</div>
              </div>
              <span className={`rec-badge ${rec.is_active ? "badge-active" : "badge-inactive"}`}>
                {rec.is_active ? "Active" : "Inactive"}
              </span>
              <div className="rec-actions">
                {rec.is_active ? (
                  <button
                    id={`deactivate-${rec.id}`}
                    className="icon-btn danger"
                    onClick={() => handleDeactivate(rec.id, rec.name)}
                    title="Deactivate"
                  >
                    <Trash2 size={15} />
                  </button>
                ) : (
                  <button
                    id={`reactivate-${rec.id}`}
                    className="icon-btn"
                    onClick={() => handleReactivate(rec.id, rec.name)}
                    title="Reactivate"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
