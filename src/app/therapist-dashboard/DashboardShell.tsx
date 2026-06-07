"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Key, Users, Settings, Shield, Bell, UserPlus } from "lucide-react";
import { api, Therapist } from "../lib/api";
import { Notification } from "./types";
import styles from "./TherapistDashboard.module.scss";

const NAV = [
  { href: "/therapist-dashboard/referrals", label: "Referrals", icon: Key },
  { href: "/therapist-dashboard/clients", label: "Connected Clients", icon: Users, badgeKey: "requests" as const },
  { href: "/therapist-dashboard/onboarding", label: "Onboard Patients", icon: UserPlus },
  { href: "/therapist-dashboard/profile", label: "Clinical Profile", icon: Settings },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("therapist");
    if (!stored) {
      router.push("/therapist-signin");
      return;
    }
    try {
      setTherapist(JSON.parse(stored) as Therapist);
    } catch {
      router.push("/therapist-signin");
    }
    api.getNotifications().then((r) => r.success && setNotifications(r.notifications || [])).catch(() => {});
    api.getPendingConnectionRequests().then((r) => r.success && setPendingRequests(r.requests?.length || 0)).catch(() => {});
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("therapist");
    localStorage.removeItem("session_token");
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
    </div>
  );
}
