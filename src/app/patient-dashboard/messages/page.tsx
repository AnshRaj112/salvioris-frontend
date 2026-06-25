"use client";

import { useEffect, useState, useRef } from "react";
import { patientApi, PatientApiError, DMMessage } from "../../lib/api/patient";
import { getPatientToken } from "../../lib/auth/patient";
import styles from "../../therapist-dashboard/TherapistDashboard.module.scss";

export default function MessagesPage() {
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const load = async () => {
    try {
      const r = await patientApi.listMessages();
      setMessages((r.data || []).reverse());
      await patientApi.markConversationRead().catch(() => {});
    } catch (e) {
      setError((e as PatientApiError).message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let active = true;

    async function initWS() {
      try {
        const token = getPatientToken();
        if (!token) return;

        // Fetch conversation details to get tenant_id and convo_id
        const convoRes = await patientApi.getConversation();
        const tenantId = convoRes.data?.tenant_id;
        const conversationId = convoRes.data?.id;
        if (!tenantId || !conversationId || !active) return;

        const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const wsUrl = apiHost.replace(/^http/, "ws") + `/ws/v1/tenant/${tenantId}/dm?token=${encodeURIComponent(token)}`;

        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("Patient DM WebSocket connected");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "message.new" && data.conversation_id === conversationId) {
              const newMsg: DMMessage = {
                id: data.message_id || Date.now().toString(),
                content: data.content,
                sender_role: data.sender_role,
                created_at: data.timestamp || new Date().toISOString(),
              };
              setMessages((prev) => [...prev, newMsg]);
              patientApi.markConversationRead().catch(() => {});
            }
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        ws.onclose = () => {
          console.log("Patient DM WebSocket disconnected");
          // Reconnect after 3s
          if (active) {
            setTimeout(initWS, 3000);
          }
        };
      } catch (err) {
        console.error("Failed to initialize patient DM WebSocket:", err);
      }
    }

    initWS();

    return () => {
      active = false;
      if (ws) {
        ws.close();
      }
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
    } catch (err) {
      setError((err as PatientApiError).message);
    }
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
