"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Sparkles, Pill, CheckSquare, Heart, MessageCircle } from "lucide-react";
import {
  tenantApi,
  TenantApiError,
  V2Patient,
  V2SessionNote,
  TenantPrescription,
  TenantTask,
  WellnessEntry,
} from "../../../lib/api/tenant";
import { AlertMessages } from "../../Alerts";
import styles from "../../TherapistDashboard.module.scss";

export default function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<V2Patient | null>(null);
  const [notes, setNotes] = useState<V2SessionNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [rating, setRating] = useState("");
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"notes" | "care">("notes");
  const [rx, setRx] = useState<TenantPrescription[]>([]);
  const [tasks, setTasks] = useState<TenantTask[]>([]);
  const [wellness, setWellness] = useState<WellnessEntry[]>([]);
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [taskTitle, setTaskTitle] = useState("");

  const load = async () => {
    try {
      const [pRes, nRes] = await Promise.all([
        tenantApi.getPatient(patientId),
        tenantApi.listNotes(patientId),
      ]);
      setPatient(pRes.data);
      setNotes(nRes.data || []);
    } catch (e) {
      setError((e as TenantApiError).message);
    }
  };

  const loadCare = async () => {
    try {
      const [rxRes, taskRes, wellRes] = await Promise.all([
        tenantApi.listPrescriptions(patientId),
        tenantApi.listPatientTasks(patientId),
        tenantApi.listPatientWellness(patientId),
      ]);
      setRx(rxRes.data || []);
      setTasks(taskRes.data || []);
      setWellness(wellRes.data || []);
    } catch (e) {
      setError((e as TenantApiError).message);
    }
  };

  useEffect(() => {
    if (patientId) {
      load();
      loadCare();
    }
  }, [patientId]);

  const createNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tenantApi.createNote(patientId, {
        plain_text: noteText,
        progress_rating: rating ? parseInt(rating, 10) : undefined,
      });
      setNoteText("");
      setRating("");
      load();
    } catch (err) {
      setError((err as TenantApiError).message);
    }
  };

  const publish = async (noteId: string) => {
    try {
      await tenantApi.publishNote(patientId, noteId);
      load();
    } catch (err) {
      setError((err as TenantApiError).message);
    }
  };

  const loadAI = async () => {
    try {
      const res = await tenantApi.patientProgress(patientId);
      setAiInsight(res.data.summary + "\n" + res.data.insights.join("\n"));
    } catch (err) {
      setError((err as TenantApiError).message);
    }
  };

  const addRx = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tenantApi.createPrescription(patientId, { medicine_name: medName, dosage, frequency });
      setMedName("");
      setDosage("");
      setFrequency("");
      loadCare();
    } catch (err) {
      setError((err as TenantApiError).message);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tenantApi.createTask(patientId, { title: taskTitle });
      setTaskTitle("");
      loadCare();
    } catch (err) {
      setError((err as TenantApiError).message);
    }
  };

  const openMessages = async () => {
    try {
      await tenantApi.getPatientConversation(patientId);
      window.location.href = "/therapist-dashboard/messages";
    } catch (err) {
      setError((err as TenantApiError).message);
    }
  };

  if (!patient) return <p className="text-sm text-slate-500">Loading patient...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold" style={{ color: "#6B4C93" }}>{patient.full_name}</h2>
        <div className="flex gap-2">
          <button onClick={openMessages} className={styles.actionButton}>
            <MessageCircle className="h-4 w-4" /> Message
          </button>
          <button onClick={loadAI} className={styles.actionButton}>
            <Sparkles className="h-4 w-4" /> AI Progress
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("notes")} className={`${styles.smallButton} ${tab === "notes" ? styles.active : ""}`}>Notes</button>
        <button onClick={() => setTab("care")} className={`${styles.smallButton} ${tab === "care" ? styles.active : ""}`}>Care plan</button>
      </div>
      <AlertMessages error={error} success={null} />
      {aiInsight && (
        <div className={styles.noteCard}>
          <p className="text-xs font-bold">AI Progress Insight</p>
          <p className="text-xs whitespace-pre-wrap mt-1">{aiInsight}</p>
          <p className="text-[10px] text-slate-400 mt-2">Not a medical diagnosis.</p>
        </div>
      )}

      {tab === "care" && (
        <div className="flex flex-col gap-4">
          <form onSubmit={addRx} className={styles.formCard}>
            <h3 className="text-sm font-bold flex items-center gap-2"><Pill className="h-4 w-4" /> Add prescription</h3>
            <input className={styles.input} placeholder="Medicine" value={medName} onChange={(e) => setMedName(e.target.value)} required />
            <input className={styles.input} placeholder="Dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} required />
            <input className={styles.input} placeholder="Frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} required />
            <button type="submit" className={styles.primaryButton}>Prescribe</button>
          </form>
          {rx.map((r) => (
            <div key={r.id} className={styles.noteCard}>
              <p className="text-xs font-bold">{r.medicine_name}</p>
              <p className="text-xs">{r.dosage} · {r.frequency}</p>
            </div>
          ))}

          <form onSubmit={addTask} className={styles.formCard}>
            <h3 className="text-sm font-bold flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Assign task</h3>
            <input className={styles.input} placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
            <button type="submit" className={styles.primaryButton}>Assign</button>
          </form>
          {tasks.map((t) => (
            <div key={t.id} className={styles.noteCard}>
              <p className="text-xs font-bold">{t.title}</p>
              <p className="text-xs text-slate-500">{t.status}</p>
            </div>
          ))}

          <h3 className="text-sm font-bold flex items-center gap-2"><Heart className="h-4 w-4" /> Wellness log</h3>
          {wellness.length === 0 ? (
            <p className="text-xs text-slate-500">No wellness entries yet.</p>
          ) : (
            wellness.slice(0, 5).map((w, i) => (
              <div key={i} className={styles.noteCard}>
                <p className="text-xs">{w.entry_date} · mood {String(w.metrics?.mood ?? "—")}</p>
                {w.reflection && <p className="text-xs mt-1">{w.reflection}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "notes" && <form onSubmit={createNote} className={styles.formCard}>
        <h3 className="text-sm font-bold flex items-center gap-2"><FileText className="h-4 w-4" /> New Session Note (draft)</h3>
        <textarea className={styles.textarea} rows={4} placeholder="Session notes..." value={noteText} onChange={(e) => setNoteText(e.target.value)} required />
        <input className={styles.input} placeholder="Progress 1-10 (optional)" value={rating} onChange={(e) => setRating(e.target.value)} />
        <button type="submit" className={styles.primaryButton}>Save Draft</button>
      </form>}

      {tab === "notes" && <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold">Session Timeline</h3>
        {notes.length === 0 ? (
          <p className="text-xs text-slate-500">No session notes yet.</p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className={styles.noteCard}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold">Session #{n.session_number} · {n.status}</span>
                {n.status === "draft" && (
                  <button onClick={() => publish(n.id)} className={styles.smallButton}>Publish</button>
                )}
              </div>
              <p className="text-xs mt-2 whitespace-pre-wrap">{n.plain_text || "(rich content)"}</p>
              <span className="text-[10px] text-slate-400">{new Date(n.session_date).toLocaleDateString()}</span>
            </div>
          ))
        )}
      </div>}
    </div>
  );
}
