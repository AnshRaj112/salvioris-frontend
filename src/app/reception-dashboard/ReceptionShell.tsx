"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, Users, Receipt, Key, ClipboardCheck, LayoutDashboard, LogIn, Shield } from "lucide-react";
import { clearReceptionistAuth, isReceptionistSessionExpired, renewReceptionistSession, getStoredReceptionist } from "../lib/auth/receptionist";
import styles from "./ReceptionDashboard.module.scss";

const NAV = [
  { href: "/reception-dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/reception-dashboard/appointments", label: "Appointments", icon: Calendar },
  { href: "/reception-dashboard/walk-in", label: "Walk-In", icon: LogIn },
  { href: "/reception-dashboard/patients", label: "Patients", icon: Users },
  { href: "/reception-dashboard/billing", label: "Billing", icon: Receipt },
  { href: "/reception-dashboard/referrals", label: "Referral Codes", icon: Key },
];

export default function ReceptionShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [receptionist, setReceptionist] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (isReceptionistSessionExpired()) {
      clearReceptionistAuth();
      router.push("/reception-signin?reason=session_expired");
      return;
    }

    const stored = getStoredReceptionist();
    if (!stored) {
      router.push("/reception-signin");
      return;
    }
    setReceptionist(stored);
    renewReceptionistSession();

    const expiryInterval = setInterval(() => {
      if (isReceptionistSessionExpired()) {
        clearInterval(expiryInterval);
        clearReceptionistAuth();
        router.push("/reception-signin?reason=session_expired");
      }
    }, 60_000);

    return () => clearInterval(expiryInterval);
  }, [router]);

  const handleLogout = async () => {
    clearReceptionistAuth();
    router.push("/reception-signin");
  };

  if (!receptionist) return null;

  const therapistName = receptionist.therapist_name as string;

  return (
    <div className={styles.dashboardPage}>
      <header className={styles.header}>
        <div className={styles.brandWrapper}>
          <div className={styles.logoIcon}>🏥</div>
          <h1 className={styles.brandName}>
            SERENIFY <span className={styles.badge}>Reception Desk</span>
          </h1>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.receptionistName}>
            {receptionist.name as string}
            {therapistName ? ` · ${therapistName}` : ""}
          </span>
          <button id="reception-signout-btn" onClick={handleLogout} className={styles.signOutButton}>
            Sign Out
          </button>
        </div>
      </header>

      <main className={styles.mainContainer}>
        <aside className={styles.sidebar}>
          <span className={styles.sectionLabel}>Navigation</span>
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href) && href !== "/reception-dashboard";
            const overviewActive = exact && pathname === "/reception-dashboard";
            return (
              <Link
                key={href}
                href={href}
                id={`rec-nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`${styles.navButton} ${(isActive || overviewActive) ? styles.active : ""}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}

          <div className={styles.sectionDivider} />

          <div className={styles.infoCard}>
            <h4 className={styles.infoHeader}>
              <Shield className="h-3 w-3" /> Reception Access
            </h4>
            <p className={styles.infoText}>
              Clinical records, session notes, prescriptions, and wellness logs are only accessible by the therapist.
            </p>
          </div>
        </aside>

        <section className={styles.workspace}>{children}</section>
      </main>
    </div>
  );
}
