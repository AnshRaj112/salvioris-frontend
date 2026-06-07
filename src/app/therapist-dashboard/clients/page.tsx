"use client";

import { useEffect, useState } from "react";
import { Check, X, Search, Calendar } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { AlertMessages } from "../Alerts";
import { ConnectedUser, ConnectionRequest } from "../types";
import styles from "../TherapistDashboard.module.scss";

export default function ClientsPage() {
  const [connections, setConnections] = useState<ConnectedUser[]>([]);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = async () => {
    const [connRes, reqRes] = await Promise.all([api.getConnectedUsers(), api.getPendingConnectionRequests()]);
    if (connRes.success) setConnections(connRes.connections || []);
    if (reqRes.success) setRequests(reqRes.requests || []);
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const respond = async (id: string, approve: boolean) => {
    try {
      await api.respondToConnectionRequest(id, approve);
      load();
    } catch (err) {
      setErrorMsg((err as ApiError).message || "Failed to respond.");
    }
  };

  const disconnect = async (userId: string) => {
    if (!confirm("Disconnect this patient?")) return;
    try {
      await api.disconnectPatient(userId);
      setConnections((prev) => prev.filter((c) => c.user_id !== userId));
    } catch (err) {
      setErrorMsg((err as ApiError).message || "Failed to disconnect.");
    }
  };

  const filtered = connections.filter((c) => c.username.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      <AlertMessages error={errorMsg} success={null} />

      {requests.length > 0 && (
        <div className={styles.requestsContainer}>
          <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: "#6B4C93" }}>
            <Calendar className="h-4 w-4" /> Pending Requests ({requests.length})
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {requests.map((r) => (
              <div key={r.id} className={styles.requestCard}>
                <div>
                  <h4 className="text-xs font-bold" style={{ color: "#3b2055" }}>{r.username}</h4>
                  <p className="text-[10px] text-slate-500">{new Date(r.created_at).toLocaleString()}</p>
                  {r.note && <div className={styles.requestNote}>{r.note}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => respond(r.id, false)} className={styles.rejectButton}><X className="h-4 w-4" /> Reject</button>
                  <button onClick={() => respond(r.id, true)} className={styles.approveButton}><Check className="h-4 w-4" /> Approve</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Connected Clients</h2>
          <p className={styles.sectionSubtitle}>Manage clinical relationships linked to your profile.</p>
        </div>
        <div className={styles.searchBarWrapper}>
          <Search className={`${styles.searchIcon} h-4 w-4`} />
          <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={styles.searchInput} />
        </div>
      </div>

      <div className={styles.rosterGrid}>
        {filtered.length === 0 ? (
          <div className="md:col-span-2 p-8 text-center text-slate-500 bg-white border rounded-2xl" style={{ border: "1px solid rgba(107, 76, 147, 0.12)" }}>No clients found.</div>
        ) : filtered.map((c) => (
          <div key={c.user_id} className={styles.rosterCard}>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold" style={{ color: "#3b2055" }}>{c.username}</h4>
                <span className={`${styles.rosterTypeBadge} ${c.connection_type === "referral" ? styles.referral : styles.request}`}>{c.connection_type}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Linked {new Date(c.connected_at).toLocaleDateString()}</p>
            </div>
            <button onClick={() => disconnect(c.user_id)} className={styles.actionLink}>Disconnect</button>
          </div>
        ))}
      </div>
    </div>
  );
}
