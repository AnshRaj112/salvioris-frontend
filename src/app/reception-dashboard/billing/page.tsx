"use client";

import { useEffect, useState } from "react";
import { receptionApi } from "../../lib/api/reception";
import { Receipt, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  total: number;
  status: string;
  due_at?: string;
  created_at: string;
}

interface Toast { type: "success" | "error"; message: string; }

function statusColor(s: string) {
  if (s === "paid") return { bg: "rgba(16,185,129,0.12)", color: "#34d399" };
  if (s === "overdue") return { bg: "rgba(239,68,68,0.12)", color: "#f87171" };
  if (s === "pending" || s === "sent") return { bg: "rgba(245,158,11,0.12)", color: "#fbbf24" };
  return { bg: "rgba(99,102,241,0.12)", color: "#818cf8" };
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [collecting, setCollecting] = useState<string | null>(null);
  const [payModal, setPayModal] = useState<{ invoice: Invoice } | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payProvider, setPayProvider] = useState("cash");

  function showToast(type: Toast["type"], message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function fetchInvoices() {
    setLoading(true);
    try {
      const res = await receptionApi.listInvoices({ status: statusFilter || undefined });
      setInvoices(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchInvoices(); }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function collectPayment() {
    if (!payModal) return;
    setCollecting(payModal.invoice.id);
    try {
      const res = await receptionApi.collectPayment({
        invoice_id: payModal.invoice.id,
        provider: payProvider,
        amount: parseFloat(payAmount),
      });
      if (res.success !== false) {
        showToast("success", `Payment of ₹${payAmount} collected via ${payProvider}`);
        setPayModal(null);
        setPayAmount("");
        fetchInvoices();
      } else {
        showToast("error", res.error || "Failed to collect payment");
      }
    } catch {
      showToast("error", "Network error");
    } finally {
      setCollecting(null);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700&family=Inter:wght@400;500;600&display=swap');
        .page-title { font-family:'Plus Jakarta Sans',sans-serif; font-size:24px; font-weight:700; color:#e2e8f0; letter-spacing:-0.4px; margin-bottom:4px; }
        .page-sub { font-size:13px; color:#475569; margin-bottom:28px; }
        .toolbar { display:flex; gap:12px; margin-bottom:20px; align-items:center; }
        .filter-select { background:rgba(15,15,28,0.9); border:1px solid rgba(99,102,241,0.18); border-radius:10px; padding:9px 14px; font-size:13px; color:#94a3b8; outline:none; cursor:pointer; }
        .table-wrap { background:rgba(15,15,28,0.9); border:1px solid rgba(99,102,241,0.12); border-radius:16px; overflow:hidden; }
        .table { width:100%; border-collapse:collapse; }
        .thead th { padding:12px 18px; text-align:left; font-size:11px; font-weight:600; color:#475569; letter-spacing:0.5px; text-transform:uppercase; border-bottom:1px solid rgba(99,102,241,0.1); background:rgba(99,102,241,0.04); }
        .tbody tr { border-bottom:1px solid rgba(99,102,241,0.06); transition:background 0.15s; }
        .tbody tr:last-child { border-bottom:none; }
        .tbody tr:hover { background:rgba(99,102,241,0.04); }
        .tbody td { padding:14px 18px; font-size:13px; color:#94a3b8; }
        .inv-number { color:#e2e8f0; font-weight:600; font-family:monospace; }
        .amount { color:#e2e8f0; font-weight:700; }
        .status-badge { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
        .collect-btn { background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.3); border-radius:8px; padding:6px 14px; font-size:12px; font-weight:600; color:#818cf8; cursor:pointer; transition:all 0.15s; }
        .collect-btn:hover { background:rgba(99,102,241,0.25); }
        .collect-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .empty-msg { text-align:center; padding:60px; color:#334155; font-size:14px; }
        .toast { position:fixed; bottom:24px; right:24px; background:rgba(15,15,28,0.95); border-radius:14px; padding:14px 20px; display:flex; align-items:center; gap:10px; font-size:13px; font-weight:500; z-index:999; box-shadow:0 8px 32px rgba(0,0,0,0.5); animation:slideIn 0.3s ease; border:1px solid; }
        .toast.success { color:#34d399; border-color:rgba(16,185,129,0.3); }
        .toast.error { color:#f87171; border-color:rgba(239,68,68,0.3); }
        @keyframes slideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:100; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); }
        .modal { background:#0f0f1c; border:1px solid rgba(99,102,241,0.25); border-radius:20px; padding:32px; width:100%; max-width:400px; box-shadow:0 24px 80px rgba(0,0,0,0.7); }
        .modal-title { font-family:'Plus Jakarta Sans',sans-serif; font-size:18px; font-weight:700; color:#e2e8f0; margin-bottom:20px; }
        .modal-field { margin-bottom:16px; }
        .modal-label { display:block; font-size:11px; font-weight:600; color:#64748b; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:7px; }
        .modal-input, .modal-select { width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(99,102,241,0.18); border-radius:10px; padding:11px 14px; font-size:14px; color:#e2e8f0; outline:none; transition:border-color 0.2s; }
        .modal-input:focus, .modal-select:focus { border-color:#6366f1; }
        .modal-actions { display:flex; gap:10px; margin-top:24px; }
        .modal-submit { flex:1; background:linear-gradient(135deg,#6366f1,#8b5cf6); border:none; border-radius:10px; padding:12px; font-size:14px; font-weight:600; color:#fff; cursor:pointer; }
        .modal-cancel { flex:1; background:rgba(100,116,139,0.1); border:1px solid rgba(100,116,139,0.2); border-radius:10px; padding:12px; font-size:14px; font-weight:600; color:#64748b; cursor:pointer; }
      `}</style>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <CreditCard size={18} style={{ display: "inline", marginRight: 8 }} />
              Collect Payment
            </div>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
              Invoice {payModal.invoice.invoice_number} · Total: ₹{payModal.invoice.total}
            </p>
            <div className="modal-field">
              <label className="modal-label">Amount Received</label>
              <input id="pay-amount" className="modal-input" type="number" placeholder="0.00" value={payAmount} onChange={e => setPayAmount(e.target.value)} autoFocus />
            </div>
            <div className="modal-field">
              <label className="modal-label">Payment Method</label>
              <select id="pay-method" className="modal-select" value={payProvider} onChange={e => setPayProvider(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card / POS</option>
                <option value="upi">UPI</option>
                <option value="neft">NEFT / Bank Transfer</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setPayModal(null)}>Cancel</button>
              <button id="pay-submit" className="modal-submit" onClick={collectPayment} disabled={!!collecting || !payAmount}>
                {collecting ? "Processing…" : "Collect Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-title">Billing</div>
      <div className="page-sub">View invoices and collect cash / card payments at the desk</div>

      <div className="toolbar">
        <select id="billing-status-filter" className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All invoices</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty-msg">Loading…</div>
        ) : invoices.length === 0 ? (
          <div className="empty-msg">
            <Receipt size={36} color="#334155" style={{ margin: "0 auto 12px" }} />
            <p>No invoices found.</p>
          </div>
        ) : (
          <table className="table">
            <thead className="thead">
              <tr>
                <th>Invoice #</th>
                <th>Patient</th>
                <th>Total</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody className="tbody">
              {invoices.map(inv => {
                const sc = statusColor(inv.status);
                return (
                  <tr key={inv.id}>
                    <td className="inv-number">{inv.invoice_number}</td>
                    <td>{inv.patient_id.slice(-8)}</td>
                    <td className="amount">₹{Number(inv.total).toFixed(2)}</td>
                    <td>
                      <span className="status-badge" style={{ background: sc.bg, color: sc.color }}>
                        {inv.status}
                      </span>
                    </td>
                    <td>{inv.due_at ? new Date(inv.due_at).toLocaleDateString() : "—"}</td>
                    <td>
                      {inv.status !== "paid" && (
                        <button
                          id={`collect-${inv.id}`}
                          className="collect-btn"
                          onClick={() => { setPayModal({ invoice: inv }); setPayAmount(String(inv.total)); }}
                          disabled={collecting === inv.id}
                        >
                          Collect Payment
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
