"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Calendar, Pill, CheckSquare, MessageCircle, Receipt, Home, LogOut, BookOpen } from "lucide-react";
import { clearPatientAuth, getPatientUser, getPatientToken, isPatientSessionExpired, renewPatientSession } from "../lib/auth/patient";
import { patientApi } from "../lib/api/patient";
import SessionReminder from "../components/SessionReminder";
import styles from "./PatientDashboard.module.scss";

const NAV = [
  { href: "/patient-dashboard", label: "Home", icon: Home },
  { href: "/patient-dashboard/wellness", label: "Wellness", icon: Heart },
  { href: "/patient-dashboard/journals", label: "Journal", icon: BookOpen },
  { href: "/patient-dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/patient-dashboard/prescriptions", label: "Medicines", icon: Pill },
  { href: "/patient-dashboard/appointments", label: "Appointments", icon: Calendar },
  { href: "/patient-dashboard/messages", label: "Messages", icon: MessageCircle, badgeKey: "messages" as const },
  { href: "/patient-dashboard/billing", label: "Billing", icon: Receipt },
];

export default function PatientShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    // Graceful pre-expiry check — redirect BEFORE cookie disappears
    if (isPatientSessionExpired()) {
      clearPatientAuth();
      router.push("/signin?reason=session_expired");
      return;
    }
    const u = getPatientUser();
    if (!u) {
      router.push("/signin?redirect=/patient-dashboard");
      return;
    }
    // Sliding window — every visit extends the session 7 days from now
    renewPatientSession();
    setUser(u);

    // Periodic expiry check every 60 seconds while the tab is open
    const expiryInterval = setInterval(() => {
      if (isPatientSessionExpired()) {
        clearInterval(expiryInterval);
        clearPatientAuth();
        router.push("/signin?reason=session_expired");
      }
    }, 60_000);

    return () => clearInterval(expiryInterval);
  }, [router]);

  useEffect(() => {
    if (!user) return;

    // Load initial unread count
    patientApi.getConversation().then((res) => {
      const unread = (res.data as any)?.unread_count_patient || 0;
      setUnreadMessages(unread);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    const handleRead = () => {
      patientApi.getConversation().then((res) => {
        const unread = (res.data as any)?.unread_count_patient || 0;
        setUnreadMessages(unread);
      }).catch(() => {});
    };
    window.addEventListener("dm-messages-read", handleRead);
    return () => window.removeEventListener("dm-messages-read", handleRead);
  }, []);

  useEffect(() => {
    if (!user) return;
    let ws: WebSocket | null = null;
    let active = true;

    async function initWS() {
      try {
        const token = getPatientToken();
        if (!token) return;

        const convoRes = await patientApi.getConversation();
        const tenantId = convoRes.data?.tenant_id;
        const conversationId = convoRes.data?.id;
        if (!tenantId || !conversationId || !active) return;

        const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const wsUrl = apiHost.replace(/^http/, "ws") + `/ws/v1/tenant/${tenantId}/dm?token=${encodeURIComponent(token)}`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("PatientShell DM WebSocket connected");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "message.new" && data.conversation_id === conversationId) {
              // Dispatch custom event for the messages page
              window.dispatchEvent(new CustomEvent("new-dm-message", { detail: data }));

              // Increment badge count if not on the messages page
              if (window.location.pathname !== "/patient-dashboard/messages") {
                setUnreadMessages((prev) => prev + 1);
              }
            }
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        ws.onclose = () => {
          console.log("PatientShell DM WebSocket disconnected");
          if (active) {
            setTimeout(initWS, 3000);
          }
        };
      } catch (err) {
        console.error("Failed to initialize PatientShell DM WebSocket:", err);
      }
    }

    initWS();

    return () => {
      active = false;
      if (ws) {
        ws.close();
      }
    };
  }, [user]);

  const logout = () => {
    clearPatientAuth();
    router.push("/signin");
  };

  if (!user) return null;

  return (
    <div className={styles.dashboardPage}>
      <header className={styles.header}>
        <h1 className={styles.brandName}>SALVIORIS <span className={styles.badge}>My Care</span></h1>
        <div className={styles.headerActions}>
          <span className={styles.userName}>@{user.username}</span>
          <button onClick={logout} className={styles.signOutButton}><LogOut className="h-4 w-4" /> Sign Out</button>
        </div>
      </header>
      <main className={styles.mainContainer}>
        <aside className={styles.sidebar}>
          {NAV.map(({ href, label, icon: Icon, badgeKey }) => (
            <Link key={href} href={href} className={`${styles.navButton} ${pathname === href ? styles.active : ""}`}>
              <Icon className="h-4 w-4" /> <span>{label}</span>
              {badgeKey === "messages" && unreadMessages > 0 && (
                <span className={styles.navBadge}>{unreadMessages}</span>
              )}
            </Link>
          ))}
        </aside>
        <section className={styles.workspace}>{children}</section>
      </main>
      <SessionReminder role="patient" />
    </div>
  );
}
