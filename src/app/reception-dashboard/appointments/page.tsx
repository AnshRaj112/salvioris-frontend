"use client";

import { useEffect, useState } from "react";
import { receptionApi } from "../../lib/api/reception";
import { Calendar, ChevronLeft, ChevronRight, Clock, Filter } from "lucide-react";

interface Appointment {
  id: string;
  patient_id: string;
  type: string;
  status: string;
  starts_at: string;
  ends_at: string;
  location?: string;
  notes?: string;
}

function statusColor(s: string) {
  if (s === "confirmed" || s === "completed") return { bg: "rgba(16,185,129,0.12)", color: "#34d399" };
  if (s === "cancelled") return { bg: "rgba(239,68,68,0.12)", color: "#f87171" };
  return { bg: "rgba(99,102,241,0.12)", color: "#818cf8" };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState("");

  const from = new Date(currentDate);
  from.setHours(0, 0, 0, 0);
  const to = new Date(currentDate);
  to.setHours(23, 59, 59, 999);

  async function fetchApts() {
    setLoading(true);
    try {
      const res = await receptionApi.listAppointments({
        from: from.toISOString(),
        to: to.toISOString(),
        status: statusFilter || undefined,
      });
      setAppointments(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchApts(); }, [currentDate, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const prevDay = () => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  const nextDay = () => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });
  const isToday = currentDate.toDateString() === new Date().toDateString();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700&family=Inter:wght@400;500;600&display=swap');
        .page-title { font-family:'Plus Jakarta Sans',sans-serif; font-size:24px; font-weight:700; color:#e2e8f0; letter-spacing:-0.4px; margin-bottom:4px; }
        .page-sub { font-size:13px; color:#475569; margin-bottom:28px; }
        .toolbar { display:flex; align-items:center; gap:12px; margin-bottom:24px; flex-wrap:wrap; }
        .date-nav { display:flex; align-items:center; gap:8px; background:rgba(15,15,28,0.9); border:1px solid rgba(99,102,241,0.18); border-radius:12px; padding:8px 14px; }
        .date-btn { background:none; border:none; cursor:pointer; color:#94a3b8; padding:2px; display:flex; align-items:center; transition:color 0.15s; }
        .date-btn:hover { color:#c4b5fd; }
        .date-label { font-size:14px; font-weight:600; color:#e2e8f0; min-width:160px; text-align:center; }
        .today-btn { background:rgba(99,102,241,0.12); border:1px solid rgba(99,102,241,0.25); border-radius:8px; padding:6px 12px; font-size:12px; font-weight:600; color:#818cf8; cursor:pointer; transition:all 0.15s; }
        .today-btn:hover { background:rgba(99,102,241,0.22); }
        .filter-select { background:rgba(15,15,28,0.9); border:1px solid rgba(99,102,241,0.18); border-radius:10px; padding:8px 12px; font-size:13px; color:#94a3b8; cursor:pointer; outline:none; margin-left:auto; }
        .apt-list { display:flex; flex-direction:column; gap:10px; }
        .apt-card {
          background:rgba(15,15,28,0.9); border:1px solid rgba(99,102,241,0.12); border-radius:16px;
          padding:18px 22px; display:flex; align-items:center; gap:20px; transition:border-color 0.2s;
        }
        .apt-card:hover { border-color:rgba(99,102,241,0.28); }
        .apt-time-col { display:flex; flex-direction:column; gap:4px; min-width:90px; }
        .apt-time-start { font-size:15px; font-weight:700; color:#e2e8f0; }
        .apt-time-end { font-size:11px; color:#475569; }
        .apt-info { flex:1; }
        .apt-patient { font-size:15px; font-weight:600; color:#e2e8f0; margin-bottom:4px; }
        .apt-meta { font-size:12px; color:#64748b; display:flex; gap:10px; }
        .apt-location { font-size:12px; color:#64748b; }
        .apt-status-badge { padding:4px 12px; border-radius:20px; font-size:11px; font-weight:600; white-space:nowrap; }
        .empty-msg { text-align:center; padding:60px 20px; color:#334155; }
        .empty-icon { font-size:42px; margin-bottom:12px; }
        .empty-text { font-size:14px; }
      `}</style>

      <div>
        <div className="page-title">Appointments</div>
        <div className="page-sub">Full appointment calendar — view all sessions for any day</div>

        <div className="toolbar">
          <div className="date-nav">
            <button className="date-btn" onClick={prevDay} aria-label="Previous day"><ChevronLeft size={16} /></button>
            <span className="date-label">
              {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </span>
            <button className="date-btn" onClick={nextDay} aria-label="Next day"><ChevronRight size={16} /></button>
          </div>
          {!isToday && (
            <button className="today-btn" onClick={() => setCurrentDate(new Date())}>Today</button>
          )}
          <select
            id="apt-status-filter"
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="empty-msg"><div className="empty-icon"><Calendar size={40} color="#334155" /></div><div className="empty-text">Loading…</div></div>
        ) : appointments.length === 0 ? (
          <div className="empty-msg">
            <div className="empty-icon"><Calendar size={40} color="#334155" /></div>
            <div className="empty-text">No appointments{statusFilter ? ` with status "${statusFilter}"` : ""} for this day.</div>
          </div>
        ) : (
          <div className="apt-list">
            {appointments.map((a) => {
              const sc = statusColor(a.status);
              return (
                <div key={a.id} className="apt-card">
                  <div className="apt-time-col">
                    <div className="apt-time-start" style={{ color: "#818cf8" }}>
                      <Clock size={12} style={{ display: "inline", marginRight: 4 }} />
                      {new Date(a.starts_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="apt-time-end">
                      → {new Date(a.ends_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className="apt-info">
                    <div className="apt-patient">Patient #{a.patient_id.slice(-8)}</div>
                    <div className="apt-meta">
                      <span style={{ textTransform: "capitalize" }}>{a.type.replace("_", " ")}</span>
                      {a.location && <span>📍 {a.location}</span>}
                    </div>
                  </div>
                  <div className="apt-status-badge" style={{ background: sc.bg, color: sc.color }}>
                    {a.status}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
