"use client";

import { useEffect, useState } from "react";
import { patientApi, PatientApiError, PatientAppointment } from "../../lib/api/patient";
import styles from "../../therapist-dashboard/TherapistDashboard.module.scss";

export default function AppointmentsPage() {
  const [items, setItems] = useState<PatientAppointment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    patientApi.listAppointments()
      .then((r) => setItems(r.data || []))
      .catch((e) => setError((e as PatientApiError).message));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold" style={{ color: "#6B4C93" }}>Appointments</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {items.map((a) => (
        <div key={a.id} className={styles.clientCard}>
          <div>
            <p className="text-sm font-bold">{new Date(a.starts_at).toLocaleString()}</p>
            <p className="text-xs text-slate-500">{a.type} · {a.status}</p>
            {a.meeting_link && <a href={a.meeting_link} className="text-xs text-purple-700">Join meeting</a>}
          </div>
        </div>
      ))}
    </div>
  );
}
