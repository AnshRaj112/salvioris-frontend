"use client";

import { useEffect, useState } from "react";
import { receptionApi } from "../../lib/api/reception";
import { Users, Search } from "lucide-react";

interface Patient {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  gender?: string;
  status: string;
  created_at: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    receptionApi.listPatients()
      .then(r => setPatients(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || "").includes(search)
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700&family=Inter:wght@400;500;600&display=swap');
        .page-title { font-family:'Plus Jakarta Sans',sans-serif; font-size:24px; font-weight:700; color:#e2e8f0; letter-spacing:-0.4px; margin-bottom:4px; }
        .page-sub { font-size:13px; color:#475569; margin-bottom:28px; }
        .toolbar { display:flex; gap:12px; margin-bottom:20px; align-items:center; }
        .search-wrap { position:relative; flex:1; max-width:360px; }
        .search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#475569; pointer-events:none; }
        .search-input {
          width:100%; background:rgba(15,15,28,0.9); border:1px solid rgba(99,102,241,0.18); border-radius:12px;
          padding:10px 14px 10px 38px; font-size:13px; color:#e2e8f0; outline:none; transition:border-color 0.2s;
        }
        .search-input:focus { border-color:#6366f1; }
        .search-input::placeholder { color:#334155; }
        .count { font-size:13px; color:#475569; margin-left:auto; }
        .table-wrap { background:rgba(15,15,28,0.9); border:1px solid rgba(99,102,241,0.12); border-radius:16px; overflow:hidden; }
        .table { width:100%; border-collapse:collapse; }
        .thead th { padding:12px 18px; text-align:left; font-size:11px; font-weight:600; color:#475569; letter-spacing:0.5px; text-transform:uppercase; border-bottom:1px solid rgba(99,102,241,0.1); background:rgba(99,102,241,0.04); }
        .tbody tr { border-bottom:1px solid rgba(99,102,241,0.06); transition:background 0.15s; }
        .tbody tr:last-child { border-bottom:none; }
        .tbody tr:hover { background:rgba(99,102,241,0.04); }
        .tbody td { padding:14px 18px; font-size:13px; color:#94a3b8; vertical-align:middle; }
        .name { color:#e2e8f0; font-weight:600; }
        .status-badge { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
        .status-active { background:rgba(16,185,129,0.12); color:#34d399; }
        .status-inactive { background:rgba(100,116,139,0.12); color:#64748b; }
        .empty-msg { text-align:center; padding:60px; color:#334155; font-size:14px; }
      `}</style>

      <div className="page-title">Patients</div>
      <div className="page-sub">View all registered patients in this practice — {patients.length} total</div>

      <div className="toolbar">
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            id="patient-search"
            className="search-input"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="count">{filtered.length} patient{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty-msg">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-msg">
            <Users size={36} color="#334155" style={{ margin: "0 auto 12px" }} />
            <p>{search ? "No patients match your search." : "No patients registered yet."}</p>
          </div>
        ) : (
          <table className="table">
            <thead className="thead">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Status</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody className="tbody">
              {filtered.map(p => (
                <tr key={p.id}>
                  <td className="name">{p.full_name}</td>
                  <td>{p.email || "—"}</td>
                  <td>{p.phone || "—"}</td>
                  <td style={{ textTransform: "capitalize" }}>{p.gender || "—"}</td>
                  <td>
                    <span className={`status-badge status-${p.status}`}>{p.status}</span>
                  </td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
