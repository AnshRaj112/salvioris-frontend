"use client";

import { useEffect, useState } from "react";
import { patientApi, PatientApiError, PatientTask } from "../../lib/api/patient";
import styles from "../../therapist-dashboard/TherapistDashboard.module.scss";

export default function TasksPage() {
  const [tasks, setTasks] = useState<PatientTask[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => patientApi.listTasks().then((r) => setTasks(r.data || [])).catch((e) => setError((e as PatientApiError).message));
  useEffect(() => { load(); }, []);

  const complete = async (id: string) => {
    await patientApi.completeTask(id);
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold" style={{ color: "#6B4C93" }}>My Tasks</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {tasks.length === 0 ? <p className="text-sm text-slate-500">No tasks assigned.</p> : tasks.map((t) => (
        <div key={t.id} className={styles.clientCard}>
          <div className="flex-1">
            <h4 className="text-sm font-bold">{t.title}</h4>
            <p className="text-xs text-slate-500">{t.description || t.status}</p>
          </div>
          {t.status !== "completed" && (
            <button onClick={() => complete(t.id)} className={styles.smallButton}>Done</button>
          )}
        </div>
      ))}
    </div>
  );
}
