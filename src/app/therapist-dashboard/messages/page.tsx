"use client";

import { useEffect, useState, useRef } from "react";
import { MessageCircle, Check, CheckCheck } from "lucide-react";
import { tenantApi, TenantApiError, DMConversation, DMMessage } from "../../lib/api/tenant";
import { AlertMessages } from "../Alerts";
import styles from "../TherapistDashboard.module.scss";

export default function TherapistMessagesPage() {
  const [convos, setConvos] = useState<DMConversation[]>([]);
  const [active, setActive] = useState<DMConversation | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeRef = useRef<DMConversation | null>(null);

  const loadConvos = () =>
    tenantApi.listConversations()
      .then((r) => {
        setConvos(r.data || []);
        window.dispatchEvent(new CustomEvent("dm-messages-read")); // Tell DashboardShell to update badge
      })
      .catch((e) => setError((e as TenantApiError).message));

  useEffect(() => {
    loadConvos();
  }, []);

  // Sync active state to ref for WebSocket callbacks
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Handle global custom events from DashboardShell
  useEffect(() => {
    let isComponentActive = true;

    const handleNewMessage = (e: Event) => {
      const data = (e as CustomEvent).detail;
      if (isComponentActive) {
        // Refresh convo list to update previews and unread badges
        loadConvos();

        // If it belongs to currently active conversation, append it in real-time
        if (activeRef.current && data.conversation_id === activeRef.current.id) {
          const newMsg: DMMessage = {
            id: data.message_id || Date.now().toString(),
            content: data.content,
            sender_role: data.sender_role,
            created_at: data.timestamp || new Date().toISOString(),
            read_at: data.sender_role !== "therapist" ? new Date().toISOString() : null,
          };
          setMessages((prev) => [...prev, newMsg]);
          tenantApi.markConversationRead(activeRef.current.id).catch(() => {});
          window.dispatchEvent(new CustomEvent("dm-messages-read")); // Tell DashboardShell to update badge
        }
      }
    };

    window.addEventListener("new-dm-message", handleNewMessage);

    return () => {
      isComponentActive = false;
      window.removeEventListener("new-dm-message", handleNewMessage);
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
                className={`w-full text-left p-2 rounded mb-1 transition-colors duration-150 ${
                  active?.id === c.id ? "bg-purple-50 border-l-2 border-purple-600 pl-1.5" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-slate-800">{c.patient_name || c.patient_id.slice(0, 8)}</p>
                  {(c.unread_count_therapist || 0) > 0 && (
                    <span className="bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] h-[16px] flex items-center justify-center">
                      {c.unread_count_therapist}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{c.last_message_preview || "—"}</p>
              </button>
            ))
          )}
        </div>

        <div className={`${styles.formCard} md:col-span-2 flex flex-col`}>
          {!active ? (
            <p className="text-xs text-slate-500">Select a conversation</p>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-3 max-h-72 p-2">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`text-xs p-3 rounded-lg max-w-[80%] shadow-sm transition-all duration-200 ${
                      m.sender_role === "therapist"
                        ? "bg-indigo-50 text-indigo-900 border border-indigo-200/60 self-end rounded-tr-none"
                        : "bg-emerald-50 text-emerald-900 border border-emerald-200/60 self-start rounded-tl-none"
                    }`}
                  >
                    <p className="font-medium text-slate-800 break-words">{m.content}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="block text-[9px] text-slate-400">
                        {new Date(m.created_at).toLocaleString()}
                      </span>
                      {m.sender_role === "therapist" && (
                        <span className="inline-flex items-center">
                          {m.read_at ? (
                            <CheckCheck className="h-3 w-3 text-purple-600" title="Read" />
                          ) : (
                            <Check className="h-3 w-3 text-slate-400" title="Sent" />
                          )}
                        </span>
                      )}
                    </div>
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
