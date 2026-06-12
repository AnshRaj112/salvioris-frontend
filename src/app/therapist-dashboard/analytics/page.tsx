"use client";

import { useEffect, useState } from "react";
import { BarChart3, AlertTriangle } from "lucide-react";
import { tenantApi, TenantApiError, AnalyticsOverview } from "../../lib/api/tenant";
import { AlertMessages } from "../Alerts";
import styles from "../TherapistDashboard.module.scss";

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [alerts, setAlerts] = useState<Array<{ patient_name: string; risk_indicators: string[] }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([tenantApi.analyticsOverview(), tenantApi.riskAlerts()])
      .then(([o, a]) => {
        setOverview(o.data);
        setAlerts(a.data || []);
      })
      .catch((e) => setError((e as TenantApiError).message));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "#6B4C93" }}>
        <BarChart3 className="h-5 w-5" /> Analytics
      </h2>
      <AlertMessages error={error} success={null} />

      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Patients", value: overview.active_patients },
            { label: "Sessions (month)", value: overview.sessions_completed_month },
            { label: "Appts (week)", value: overview.appointments_upcoming_week },
            { label: `Revenue (${overview.currency})`, value: overview.revenue_month.toFixed(0) },
          ].map((m) => (
            <div key={m.label} className={styles.statCard}>
              <p className="text-xs text-slate-500">{m.label}</p>
              <p className="text-xl font-bold" style={{ color: "#6B4C93" }}>{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <div className={styles.requestsContainer}>
          <h3 className="text-sm font-bold flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-4 w-4" /> Risk Alerts
          </h3>
          {alerts.map((a, i) => (
            <div key={i} className={styles.alertItem}>
              <strong className="text-xs">{a.patient_name}</strong>
              <p className="text-[10px]">{a.risk_indicators.join(", ")}</p>
            </div>
          ))}
          <p className="text-[10px] text-slate-400 mt-2">AI-assisted insight. Not a medical diagnosis.</p>
        </div>
      )}
    </div>
  );
}
