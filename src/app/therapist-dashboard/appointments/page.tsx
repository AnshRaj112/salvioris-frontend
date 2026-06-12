"use client";

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { tenantApi, TenantApiError, V2Appointment, V2Patient } from "../../lib/api/tenant";
import { AlertMessages } from "../Alerts";
import styles from "../TherapistDashboard.module.scss";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<V2Appointment[]>([]);
  const [patients, setPatients] = useState<V2Patient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [patientId, setPatientId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [type, setType] = useState("in_person");
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarConfigured, setCalendarConfigured] = useState(false);

  const load = async () => {
    try {
      const [aRes, pRes] = await Promise.all([
        tenantApi.listAppointments(),
        tenantApi.listPatients(),
      ]);
      setAppointments(aRes.data || []);
      setPatients(pRes.data || []);
    } catch (e) {
      setError((e as TenantApiError).message);
    }
  };

  useEffect(() => {
    load();
    tenantApi.calendarStatus().then((s) => {
      setCalendarConnected(s.connected);
      setCalendarConfigured(s.configured);
    }).catch(() => {});
  }, []);

  const connectCalendar = async () => {
    try {
      const res = await tenantApi.connectGoogleCalendar();
      window.open(res.auth_url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError((e as TenantApiError).message);
    }
  };

  const complete = async (id: string) => {
    try {
      await tenantApi.updateAppointment(id, { status: "completed" });
      load();
    } catch (e) {
      setError((e as TenantApiError).message);
    }
  };

  const patientName = (id: string) => patients.find((p) => p.id === id)?.full_name || id.slice(0, 8);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const iso = new Date(startsAt).toISOString();
      await tenantApi.createAppointment({ patient_id: patientId, type, starts_at: iso, duration_min: 60 });
      setStartsAt("");
      load();
    } catch (err) {
      setError((err as TenantApiError).message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "#6B4C93" }}>
        <Calendar className="h-5 w-5" /> Appointments
      </h2>
      <AlertMessages error={error} success={null} />

      {calendarConfigured && (
        <div className={styles.noteCard}>
          <p className="text-xs">
            Google Calendar: {calendarConnected ? "Connected" : "Not connected"}
            {!calendarConnected && (
              <button onClick={connectCalendar} className={`${styles.smallButton} ml-2`}>Connect</button>
            )}
          </p>
        </div>
      )}

      <form onSubmit={handleCreate} className={styles.formCard}>
        <select className={styles.input} value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
          <option value="">Select patient</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
        <select className={styles.input} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="in_person">In person</option>
          <option value="online">Online</option>
          <option value="walk_in">Walk-in</option>
        </select>
        <input className={styles.input} type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
        <button type="submit" className={styles.primaryButton}>Schedule</button>
      </form>

      <div className="grid gap-3">
        {appointments.map((a) => (
          <div key={a.id} className={styles.clientCard}>
            <div>
              <h4 className="text-sm font-bold">{patientName(a.patient_id)}</h4>
              <p className="text-xs text-slate-500">
                {new Date(a.starts_at).toLocaleString()} · {a.type} · {a.status}
              </p>
            </div>
            {a.status !== "completed" && a.status !== "cancelled" && (
              <button onClick={() => complete(a.id)} className={styles.smallButton}>Complete</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
