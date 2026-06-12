"use client";

import { useEffect, useState } from "react";
import { patientApi, PatientApiError, WellnessEntry } from "../../lib/api/patient";
import styles from "../../therapist-dashboard/TherapistDashboard.module.scss";

export default function WellnessPage() {
  const [entries, setEntries] = useState<WellnessEntry[]>([]);
  const [mood, setMood] = useState("5");
  const [anxiety, setAnxiety] = useState("5");
  const [reflection, setReflection] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = () => patientApi.listWellness().then((r) => setEntries(r.data || [])).catch((e) => setError((e as PatientApiError).message));

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await patientApi.logWellness({
        metrics: { mood: +mood, anxiety: +anxiety },
        reflection,
      });
      setReflection("");
      load();
    } catch (err) {
      setError((err as PatientApiError).message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold" style={{ color: "#6B4C93" }}>Daily Wellness</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <form onSubmit={submit} className={styles.formCard}>
        <label className="text-xs">Mood (1-10)</label>
        <input className={styles.input} type="number" min={1} max={10} value={mood} onChange={(e) => setMood(e.target.value)} />
        <label className="text-xs">Anxiety (1-10)</label>
        <input className={styles.input} type="number" min={1} max={10} value={anxiety} onChange={(e) => setAnxiety(e.target.value)} />
        <textarea className={styles.textarea} rows={3} placeholder="Reflection..." value={reflection} onChange={(e) => setReflection(e.target.value)} />
        <button type="submit" className={styles.primaryButton}>Save today</button>
      </form>
      <div className="flex flex-col gap-2">
        {entries.slice(0, 7).map((e, i) => (
          <div key={i} className={styles.noteCard}>
            <span className="text-xs font-bold">{new Date(e.entry_date).toLocaleDateString()}</span>
            <p className="text-xs">Mood {e.metrics.mood} · Anxiety {e.metrics.anxiety}</p>
            {e.reflection && <p className="text-xs text-slate-600">{e.reflection}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
