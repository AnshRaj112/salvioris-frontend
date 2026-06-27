"use client";

import { useEffect, useState } from "react";
import { receptionApi } from "../../lib/api/reception";
import { Key, Copy, CheckCircle2 } from "lucide-react";

interface ReferralCode {
  id: string;
  code: string;
  created_at: string;
  expires_at?: string;
  usage_limit?: number;
  usage_count: number;
  is_revoked: boolean;
}

export default function ReferralsPage() {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    receptionApi.listReferralCodes()
      .then(r => setCodes(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const active = codes.filter(c => !c.is_revoked);
  const revoked = codes.filter(c => c.is_revoked);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700&family=Inter:wght@400;500;600&display=swap');
        .page-title { font-family:'Plus Jakarta Sans',sans-serif; font-size:24px; font-weight:700; color:#e2e8f0; letter-spacing:-0.4px; margin-bottom:4px; }
        .page-sub { font-size:13px; color:#475569; margin-bottom:28px; }
        .info-banner { background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2); border-radius:12px; padding:14px 18px; font-size:13px; color:#818cf8; margin-bottom:28px; display:flex; align-items:center; gap:10px; }
        .section-title { font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; font-weight:700; color:#c4b5fd; margin-bottom:14px; }
        .code-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; margin-bottom:32px; }
        .code-card { background:rgba(15,15,28,0.9); border:1px solid rgba(99,102,241,0.14); border-radius:16px; padding:20px 22px; transition:border-color 0.2s; }
        .code-card:hover { border-color:rgba(99,102,241,0.28); }
        .code-card.revoked { opacity:0.5; border-color:rgba(100,116,139,0.15); }
        .code-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
        .code-text { font-size:18px; font-weight:700; color:#e2e8f0; font-family:monospace; letter-spacing:1px; }
        .copy-btn { background:rgba(99,102,241,0.12); border:1px solid rgba(99,102,241,0.22); border-radius:8px; padding:6px 10px; cursor:pointer; color:#818cf8; display:flex; align-items:center; gap:5px; font-size:12px; transition:all 0.15s; }
        .copy-btn:hover { background:rgba(99,102,241,0.22); }
        .copy-btn.copied { color:#34d399; border-color:rgba(16,185,129,0.3); background:rgba(16,185,129,0.1); }
        .code-meta { display:flex; gap:16px; flex-wrap:wrap; }
        .meta-item { display:flex; flex-direction:column; gap:2px; }
        .meta-label { font-size:10px; color:#475569; font-weight:600; letter-spacing:0.4px; text-transform:uppercase; }
        .meta-value { font-size:13px; color:#94a3b8; font-weight:500; }
        .usage-bar { height:4px; background:rgba(99,102,241,0.12); border-radius:2px; margin-top:10px; overflow:hidden; }
        .usage-fill { height:100%; background:linear-gradient(90deg,#6366f1,#8b5cf6); border-radius:2px; transition:width 0.3s; }
        .revoked-badge { padding:2px 8px; border-radius:6px; font-size:10px; font-weight:600; background:rgba(100,116,139,0.15); color:#64748b; }
        .active-badge { padding:2px 8px; border-radius:6px; font-size:10px; font-weight:600; background:rgba(16,185,129,0.12); color:#34d399; }
        .empty-msg { text-align:center; padding:60px; color:#334155; font-size:14px; }
      `}</style>

      <div className="page-title">Referral Codes</div>
      <div className="page-sub">View and share active referral codes — managed by the therapist</div>

      <div className="info-banner">
        <Key size={16} />
        These codes are read-only. To create or revoke codes, the therapist must manage them from their dashboard.
      </div>

      {loading ? (
        <div className="empty-msg">Loading…</div>
      ) : codes.length === 0 ? (
        <div className="empty-msg">
          <Key size={36} color="#334155" style={{ margin: "0 auto 12px" }} />
          <p>No referral codes have been created yet.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <div className="section-title">Active Codes ({active.length})</div>
              <div className="code-grid">
                {active.map(c => (
                  <div key={c.id} className="code-card">
                    <div className="code-top">
                      <div className="code-text">{c.code}</div>
                      <button
                        id={`copy-${c.id}`}
                        className={`copy-btn ${copied === c.code ? "copied" : ""}`}
                        onClick={() => copyCode(c.code)}
                      >
                        {copied === c.code ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                        {copied === c.code ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <div className="code-meta">
                      <div className="meta-item">
                        <span className="meta-label">Used</span>
                        <span className="meta-value">{c.usage_count}{c.usage_limit ? ` / ${c.usage_limit}` : " / ∞"}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Expires</span>
                        <span className="meta-value">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Status</span>
                        <span className="active-badge">Active</span>
                      </div>
                    </div>
                    {c.usage_limit && (
                      <div className="usage-bar">
                        <div className="usage-fill" style={{ width: `${Math.min(100, (c.usage_count / c.usage_limit) * 100)}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {revoked.length > 0 && (
            <>
              <div className="section-title">Revoked Codes ({revoked.length})</div>
              <div className="code-grid">
                {revoked.map(c => (
                  <div key={c.id} className="code-card revoked">
                    <div className="code-top">
                      <div className="code-text">{c.code}</div>
                      <span className="revoked-badge">Revoked</span>
                    </div>
                    <div className="code-meta">
                      <div className="meta-item">
                        <span className="meta-label">Total Used</span>
                        <span className="meta-value">{c.usage_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
