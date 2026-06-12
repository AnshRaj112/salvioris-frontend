"use client";

import { useEffect, useState } from "react";
import { patientApi, PatientApiError, DMMessage } from "../../lib/api/patient";
import styles from "../../therapist-dashboard/TherapistDashboard.module.scss";

export default function MessagesPage() {
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const r = await patientApi.listMessages();
    setMessages((r.data || []).reverse());
    await patientApi.markConversationRead().catch(() => {});
  };

  useEffect(() => { load().catch((e) => setError((e as PatientApiError).message)); }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await patientApi.sendMessage(text.trim());
    setText("");
    load();
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <h2 className="text-lg font-bold" style={{ color: "#6B4C93" }}>Messages</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className={`${styles.noteCard} ${m.sender_role === "patient" ? "ml-8" : "mr-8"}`}>
            <p className="text-xs">{m.content}</p>
            <span className="text-[10px] text-slate-400">{new Date(m.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input className={styles.input} value={text} onChange={(e) => setText(e.target.value)} placeholder="Message your therapist..." />
        <button type="submit" className={styles.primaryButton}>Send</button>
      </form>
    </div>
  );
}
