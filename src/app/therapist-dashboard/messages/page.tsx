"use client";

import { useEffect, useState, useRef } from "react";
import { MessageCircle } from "lucide-react";
import { tenantApi, TenantApiError, DMConversation, DMMessage } from "../../lib/api/tenant";
import { getTenantId, getAuthToken } from "../../lib/auth/tenant";
import { AlertMessages } from "../Alerts";
import styles from "../TherapistDashboard.module.scss";

export default function TherapistMessagesPage() {
  const [convos, setConvos] = useState<DMConversation[]>([]);
  const [active, setActive] = useState<DMConversation | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const activeRef = useRef<DMConversation | null>(null);

  const loadConvos = () =>
    tenantApi.listConversations().then((r) => setConvos(r.data || [])).catch((e) => setError((e as TenantApiError).message));

  useEffect(() => {
    loadConvos();
  }, []);

  // Sync active state to ref for WebSocket callbacks
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Establish WebSocket connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let isComponentActive = true;

    function initWS() {
      try {
        const tenantId = getTenantId();
        const token = getAuthToken();
        if (!tenantId || !token || !isComponentActive) return;

        const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const wsUrl = apiHost.replace(/^http/, "ws") + `/ws/v1/tenant/${tenantId}/dm?token=${encodeURIComponent(token)}`;

        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("Therapist DM WebSocket connected");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "message.new") {
              // Refresh convo list to update previews and unread badges
              loadConvos();

              // If it belongs to currently active conversation, append it in real-time
              if (activeRef.current && data.conversation_id === activeRef.current.id) {
                const newMsg: DMMessage = {
                  id: data.message_id || Date.now().toString(),
                  content: data.content,
                  sender_role: data.sender_role,
                  created_at: data.timestamp || new Date().toISOString(),
                };
                setMessages((prev) => [...prev, newMsg]);
                tenantApi.markConversationRead(activeRef.current.id).catch(() => {});
              }
            }
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        ws.onclose = () => {
          console.log("Therapist DM WebSocket disconnected");
          if (isComponentActive) {
            setTimeout(initWS, 3000);
          }
        };
      } catch (err) {
        console.error("Failed to initialize therapist DM WebSocket:", err);
      }
    }

    initWS();

    return () => {
      isComponentActive = false;
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const openConvo = async (c: DMConversation) => {
    setActive(c);
    try {
      const res = await tenantApi.listConversationMessages(c.id);
      setMessages((res.data || []).reverse());
      await tenantApi.markConversationRead(c.id);
      loadConvos();
    } catch (e) {
      setError((e as TenantApiError).message);
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !text.trim()) return;
    try {
      const res = await tenantApi.sendConversationMessage(active.id, text.trim());
      setText("");
      if (res.data) {
        setMessages((prev) => [...prev, res.data]);
      } else {
        const fetchRes = await tenantApi.listConversationMessages(active.id);
        setMessages((fetchRes.data || []).reverse());
      }
      loadConvos();
    } catch (err) {
      setError((err as TenantApiError).message);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "#6B4C93" }}>
        <MessageCircle className="h-5 w-5" /> Messages
      </h2>
      <AlertMessages error={error} success={null} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px]">
        <div className={`${styles.noteCard} md:col-span-1 overflow-y-auto`}>
          {convos.length === 0 ? (
            <p className="text-xs text-slate-500">No conversations yet. Open a patient to start messaging.</p>
          ) : (
            convos.map((c) => (
              <button
                key={c.id}
                onClick={() => openConvo(c)}
                className={`w-full text-left p-2 rounded mb-1 ${active?.id === c.id ? "bg-purple-50" : ""}`}
              >
                <p className="text-xs font-bold">{c.patient_name || c.patient_id.slice(0, 8)}</p>
                <p className="text-[10px] text-slate-500 truncate">{c.last_message_preview || "—"}</p>
                {(c.unread_count_therapist || 0) > 0 && (
                  <span className="text-[9px] text-purple-700">{c.unread_count_therapist} unread</span>
                )}
              </button>
            ))
          )}
        </div>

        <div className={`${styles.formCard} md:col-span-2 flex flex-col`}>
          {!active ? (
            <p className="text-xs text-slate-500">Select a conversation</p>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-3 max-h-72">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`text-xs p-2 rounded max-w-[80%] ${
                      m.sender_role === "therapist" ? "bg-purple-100 self-end" : "bg-slate-100 self-start"
                    }`}
                  >
                    {m.content}
                    <span className="block text-[9px] text-slate-400 mt-1">
                      {new Date(m.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <form onSubmit={send} className="flex gap-2">
                <input className={styles.input} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
                <button type="submit" className={styles.primaryButton}>Send</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
