"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { patientApi, PatientApiError, PatientJournal } from "../../lib/api/patient";
import styles from "../../therapist-dashboard/TherapistDashboard.module.scss";

export default function JournalsPage() {
  const [journals, setJournals] = useState<PatientJournal[]>([]);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    patientApi.listJournals().then((r) => setJournals(r.data || [])).catch((e) => setError((e as PatientApiError).message));

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await patientApi.createJournal({ title: title || undefined, content });
      setContent("");
      setTitle("");
      load();
    } catch (err) {
      setError((err as PatientApiError).message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "#6B4C93" }}>
        <BookOpen className="h-5 w-5" /> Journal
      </h2>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={submit} className={styles.formCard}>
        <input className={styles.input} placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className={styles.textarea} rows={4} placeholder="How are you feeling today?" value={content} onChange={(e) => setContent(e.target.value)} required />
        <button type="submit" className={styles.primaryButton}>Save entry</button>
      </form>

      <div className="flex flex-col gap-3">
        {journals.map((j) => (
          <div key={j.id} className={styles.noteCard}>
            {j.title && <p className="text-xs font-bold">{j.title}</p>}
            <p className="text-xs whitespace-pre-wrap mt-1">{j.content}</p>
            <span className="text-[10px] text-slate-400">{new Date(j.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
