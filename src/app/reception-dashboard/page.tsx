"use client";

import { useEffect, useState } from "react";
import { receptionApi } from "../lib/api/reception";
import { Calendar, Users, Receipt, Key, LogIn, TrendingUp, Clock } from "lucide-react";

interface Stats {
  todayAppointments: number;
  totalPatients: number;
  pendingInvoices: number;
  referralCodes: number;
}

export default function ReceptionOverviewPage() {
  const [stats, setStats] = useState<Stats>({ todayAppointments: 0, totalPatients: 0, pendingInvoices: 0, referralCodes: 0 });
  const [appointments, setAppointments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const today = new Date();
        const from = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const to = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        const [aptRes, patRes, invRes, refRes] = await Promise.allSettled([
          receptionApi.listAppointments({ from, to }),
          receptionApi.listPatients(),
          receptionApi.listInvoices({ status: "pending" }),
          receptionApi.listReferralCodes(),
        ]);

        const apts = aptRes.status === "fulfilled" ? aptRes.value.data || [] : [];
        const pats = patRes.status === "fulfilled" ? patRes.value.data || [] : [];
        const invs = invRes.status === "fulfilled" ? invRes.value.data || [] : [];
        const refs = refRes.status === "fulfilled" ? refRes.value.data || [] : [];

        setAppointments(apts.slice(0, 5));
        setStats({
          todayAppointments: apts.length,
          totalPatients: pats.length,
          pendingInvoices: invs.length,
          referralCodes: refs.filter((r: Record<string, unknown>) => !r.is_revoked).length,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = [
    { label: "Today's Appointments", value: stats.todayAppointments, icon: Calendar, color: "#6366f1" },
    { label: "Total Patients", value: stats.totalPatients, icon: Users, color: "#8b5cf6" },
    { label: "Pending Invoices", value: stats.pendingInvoices, icon: Receipt, color: "#f59e0b" },
    { label: "Active Referral Codes", value: stats.referralCodes, icon: Key, color: "#10b981" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');

        .page-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #e2e8f0;
          letter-spacing: -0.5px;
          margin-bottom: 6px;
        }
        .page-sub {
          font-size: 14px;
          color: #475569;
          margin-bottom: 32px;
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 36px;
        }
        .stat-card {
          background: rgba(15,15,28,0.9);
          border: 1px solid rgba(99,102,241,0.14);
          border-radius: 16px;
          padding: 22px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: border-color 0.2s;
        }
        .stat-card:hover { border-color: rgba(99,102,241,0.28); }
        .stat-icon {
          width: 40px; height: 40px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .stat-value {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #f1f5f9;
          line-height: 1;
        }
        .stat-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }
        .section-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #c4b5fd;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .apt-card {
          background: rgba(15,15,28,0.9);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 10px;
          transition: border-color 0.2s;
        }
        .apt-card:hover { border-color: rgba(99,102,241,0.25); }
        .apt-time {
          font-size: 13px;
          font-weight: 600;
          color: #818cf8;
          min-width: 60px;
        }
        .apt-name {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
        }
        .apt-type {
          font-size: 11px;
          color: #475569;
          text-transform: capitalize;
          background: rgba(99,102,241,0.08);
          padding: 2px 8px;
          border-radius: 6px;
          margin-left: auto;
        }
        .apt-status {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 20px;
        }
        .status-confirmed { background: rgba(16,185,129,0.15); color: #34d399; }
        .status-scheduled { background: rgba(99,102,241,0.15); color: #818cf8; }
        .empty-msg {
          text-align: center;
          padding: 40px;
          color: #334155;
          font-size: 14px;
        }
        .quick-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 32px;
        }
        .action-btn {
          background: rgba(15,15,28,0.9);
          border: 1px solid rgba(99,102,241,0.18);
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.15s;
          text-decoration: none;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
        }
        .action-btn:hover {
          border-color: rgba(99,102,241,0.4);
          background: rgba(99,102,241,0.08);
          color: #c4b5fd;
        }
        .skeleton {
          background: linear-gradient(90deg, rgba(99,102,241,0.06) 25%, rgba(99,102,241,0.12) 50%, rgba(99,102,241,0.06) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 8px;
          height: 24px;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      <div>
        <div className="page-title">Reception Overview</div>
        <div className="page-sub">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>

        {/* Stat Cards */}
        <div className="stat-grid">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card">
              <div className="stat-icon" style={{ background: `${color}22` }}>
                <Icon size={18} color={color} />
              </div>
              {loading ? <div className="skeleton" style={{ width: "60px", height: "36px" }} /> : (
                <div className="stat-value">{value}</div>
              )}
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="section-title"><TrendingUp size={16} /> Quick Actions</div>
        <div className="quick-actions">
          <a href="/reception-dashboard/walk-in" className="action-btn">
            <LogIn size={18} color="#6366f1" /> Schedule Walk-In
          </a>
          <a href="/reception-dashboard/patients" className="action-btn">
            <Users size={18} color="#8b5cf6" /> Register Patient
          </a>
          <a href="/reception-dashboard/billing" className="action-btn">
            <Receipt size={18} color="#f59e0b" /> View Billing
          </a>
          <a href="/reception-dashboard/appointments" className="action-btn">
            <Calendar size={18} color="#10b981" /> Full Calendar
          </a>
        </div>

        {/* Today's Appointments */}
        <div className="section-title"><Clock size={16} /> Today&apos;s Schedule</div>
        {loading ? (
          <div className="empty-msg">Loading…</div>
        ) : appointments.length === 0 ? (
          <div className="empty-msg">No appointments scheduled for today.</div>
        ) : (
          appointments.map((a) => (
            <div key={a.id as string} className="apt-card">
              <div className="apt-time">
                {new Date(a.starts_at as string).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div>
                <div className="apt-name">Patient #{(a.patient_id as string)?.slice(-6)}</div>
              </div>
              <div className="apt-type">{a.type as string}</div>
              <div className={`apt-status status-${a.status as string}`}>{a.status as string}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
