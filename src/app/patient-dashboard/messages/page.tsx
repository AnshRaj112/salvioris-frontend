"use client";

import { useEffect, useState } from "react";
import { Check, CheckCheck } from "lucide-react";
import { patientApi, PatientApiError, DMMessage } from "../../lib/api/patient";
import styles from "../../therapist-dashboard/TherapistDashboard.module.scss";

export default function MessagesPage() {
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await patientApi.listMessages();
      setMessages((r.data || []).reverse());
      await patientApi.markConversationRead().catch(() => {});
      window.dispatchEvent(new CustomEvent("dm-messages-read")); // Tell PatientShell to clear the badge!
    } catch (e) {
      setError((e as PatientApiError).message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let active = true;
    let convoId: string | null = null;

    async function fetchConvoInfo() {
      try {
        const convoRes = await patientApi.getConversation();
        convoId = convoRes.data?.id;
      } catch (err) {
        console.error("Failed to load conversation details", err);
      }
    }

    const handleNewMessage = (e: Event) => {
      const data = (e as CustomEvent).detail;
      if (active && convoId && data.conversation_id === convoId) {
        const newMsg: DMMessage = {
          id: data.message_id || Date.now().toString(),
          content: data.content,
          sender_role: data.sender_role,
          created_at: data.timestamp || new Date().toISOString(),
          read_at: data.sender_role !== "patient" ? new Date().toISOString() : null,
        };
        setMessages((prev) => [...prev, newMsg]);
        patientApi.markConversationRead().catch(() => {});
        window.dispatchEvent(new CustomEvent("dm-messages-read")); // Tell PatientShell to update
      }
    };

    fetchConvoInfo().then(() => {
      if (active) {
        window.addEventListener("new-dm-message", handleNewMessage);
      }
    });

    return () => {
      active = false;
      window.removeEventListener("new-dm-message", handleNewMessage);
    };
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await patientApi.sendMessage(text.trim());
      setText("");
      if (res.data) {
        setMessages((prev) => [...prev, res.data]);
      } else {
        load();
      }
      window.dispatchEvent(new CustomEvent("dm-messages-read")); // Refresh unread count in shell
    } catch (err) {
      setError((err as PatientApiError).message);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <h2 className="text-lg font-bold" style={{ color: "#6B4C93" }}>Messages</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      
      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto p-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`text-xs p-3 rounded-lg max-w-[80%] shadow-sm transition-all duration-200 ${
              m.sender_role === "patient"
                ? "bg-rose-50 text-rose-900 border border-rose-200/60 self-end rounded-tr-none"
                : "bg-teal-50 text-teal-900 border border-teal-200/60 self-start rounded-tl-none"
            }`}
          >
            <p className="font-medium text-slate-800 break-words">{m.content}</p>
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-[10px] text-slate-400">
                {new Date(m.created_at).toLocaleString()}
              </span>
              {m.sender_role === "patient" && (
                <span className="inline-flex items-center">
                  {m.read_at ? (
                    <span title="Read" className="inline-flex"><CheckCheck className="h-3 w-3 text-purple-600" /></span>
                  ) : (
                    <span title="Sent" className="inline-flex"><Check className="h-3 w-3 text-slate-400" /></span>
                  )}
                </span>
              )}
            </div>
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
