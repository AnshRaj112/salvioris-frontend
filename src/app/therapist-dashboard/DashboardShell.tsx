"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Key, Users, Settings, Shield, Bell, Calendar, BarChart3, Stethoscope, MessageCircle, Clock, Heart, UserCog } from "lucide-react";
import { clearTherapistAuth, getTenantId, getAuthToken, isTherapistSessionExpired, renewTherapistSession } from "../lib/auth/tenant";
import { api, Therapist } from "../lib/api";
import { tenantApi } from "../lib/api/tenant";
import { Notification } from "./types";
import SessionReminder from "../components/SessionReminder";
import styles from "./TherapistDashboard.module.scss";

const NAV = [
  { href: "/therapist-dashboard/patients", label: "Patients", icon: Stethoscope },
  { href: "/therapist-dashboard/wellness", label: "Patient Wellness", icon: Heart },
  { href: "/therapist-dashboard/appointments", label: "Appointments", icon: Calendar },
  { href: "/therapist-dashboard/availability", label: "Working Hours", icon: Clock },
  { href: "/therapist-dashboard/messages", label: "Messages", icon: MessageCircle, badgeKey: "messages" as const },
  { href: "/therapist-dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/therapist-dashboard/referrals", label: "Referrals", icon: Key },
  { href: "/therapist-dashboard/clients", label: "Connected Clients", icon: Users, badgeKey: "requests" as const },
  { href: "/therapist-dashboard/staff", label: "Manage Staff", icon: UserCog },
  { href: "/therapist-dashboard/profile", label: "Clinical Profile", icon: Settings },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    // Graceful pre-expiry check — redirect BEFORE the cookie disappears
    if (isTherapistSessionExpired()) {
      clearTherapistAuth();
      router.push("/therapist-signin?reason=session_expired");
      return;
    }
    const stored = localStorage.getItem("therapist");
    if (!stored) {
      router.push("/therapist-signin");
      return;
    }
    try {
      setTherapist(JSON.parse(stored) as Therapist);
    } catch {
      router.push("/therapist-signin");
      return;
    }
    // Sliding window — every visit extends the session 7 days from now
    renewTherapistSession();
    api.getNotifications().then((r) => r.success && setNotifications(r.notifications || [])).catch(() => {});
    api.getPendingConnectionRequests().then((r) => r.success && setPendingRequests(r.requests?.length || 0)).catch(() => {});

    // Periodic expiry check every 60 seconds while the tab is open
    const expiryInterval = setInterval(() => {
      if (isTherapistSessionExpired()) {
        clearInterval(expiryInterval);
        clearTherapistAuth();
        router.push("/therapist-signin?reason=session_expired");
      }
    }, 60_000);

    return () => clearInterval(expiryInterval);
  }, [router]);

  useEffect(() => {
    const handleRead = () => {
      tenantApi.listConversations().then((r) => {
        const conversations = r.data || [];
        const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count_therapist || 0), 0);
        setUnreadMessages(totalUnread);
      }).catch(() => {});
    };
    window.addEventListener("dm-messages-read", handleRead);
    return () => window.removeEventListener("dm-messages-read", handleRead);
  }, []);

  useEffect(() => {
    if (!therapist) return;
    let ws: WebSocket | null = null;
    let active = true;

    async function initWS() {
      try {
        const tenantId = getTenantId();
        const token = getAuthToken();
        if (!tenantId || !token || !active) return;

        const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const wsUrl = apiHost.replace(/^http/, "ws") + `/ws/v1/tenant/${tenantId}/dm?token=${encodeURIComponent(token)}`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("DashboardShell DM WebSocket connected");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "message.new") {
              // Dispatch custom event for the messages page
              window.dispatchEvent(new CustomEvent("new-dm-message", { detail: data }));

              // Increment badge count if message is from a patient and we are not on messages page
              if (data.sender_role !== "therapist") {
                if (window.location.pathname !== "/therapist-dashboard/messages") {
                  setUnreadMessages((prev) => prev + 1);
                }
              }
            }
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        ws.onclose = () => {
          console.log("DashboardShell DM WebSocket disconnected");
          if (active) {
            setTimeout(initWS, 3000);
          }
        };
      } catch (err) {
        console.error("Failed to initialize DashboardShell DM WebSocket:", err);
      }
    }

    initWS();

    // Load initial unread count
    tenantApi.listConversations().then((r) => {
      const conversations = r.data || [];
      const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count_therapist || 0), 0);
      setUnreadMessages(totalUnread);
    }).catch(() => {});

    return () => {
      active = false;
      if (ws) ws.close();
    };
  }, [therapist]);

  const handleLogout = () => {
    clearTherapistAuth();
    router.push("/therapist-signin");
  };

  const markRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  if (!therapist) return null;

  return (
    <div className={styles.dashboardPage}>
      <header className={styles.header}>
        <div className={styles.brandWrapper}>
          <div className={styles.logoIcon}><Shield className="h-6 w-6 text-purple-700" /></div>
          <h1 className={styles.brandName}>SALVIORIS <span className={styles.badge}>Therapist Core</span></h1>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.therapistName}>Dr. {therapist.name}</span>
          <button onClick={handleLogout} className={styles.signOutButton}>Sign Out</button>
        </div>
      </header>

      <main className={styles.mainContainer}>
        <aside className={styles.sidebar}>
          {NAV.map(({ href, label, icon: Icon, badgeKey }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.navButton} ${pathname === href ? styles.active : ""}`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {badgeKey === "requests" && pendingRequests > 0 && (
                <span className={styles.navBadge}>{pendingRequests}</span>
              )}
              {badgeKey === "messages" && unreadMessages > 0 && (
                <span className={styles.navBadge}>{unreadMessages}</span>
              )}
            </Link>
          ))}
          <div className={styles.complianceCard}>
            <h4 className={styles.complianceHeader}><Shield className="h-3.5 w-3.5" /> Compliance Status</h4>
            <p className={styles.complianceText}>
              Active session encrypted via SHA-256 tokens. Profile connections enforce strict patient-consent boundary checks.
            </p>
          </div>
        </aside>

        <section className={styles.workspace}>{children}</section>

        <aside className={styles.alertsDrawer}>
          <div className={styles.alertsCard}>
            <h3 className={styles.alertsTitle}><Bell className="h-4 w-4" /> Clinic Alerts</h3>
            <div className={styles.alertList}>
              {notifications.length === 0 ? (
                <div className="text-center p-6 text-xs" style={{ color: "rgba(107, 76, 147, 0.6)" }}>No notifications yet.</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    className={`${styles.alertItem} ${n.is_read ? styles.read : styles.unread}`}
                  >
                    <div className={styles.alertHeader}>
                      <h4 className="text-[11px] font-bold">{n.title}</h4>
                      {!n.is_read && <span className={styles.alertDot} />}
                    </div>
                    <p className="text-[10px] mt-1 leading-relaxed">{n.message}</p>
                    <span className="text-[9px] block mt-1.5" style={{ opacity: 0.6 }}>
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </main>
      <SessionReminder role="therapist" />
    </div>
  );
}
