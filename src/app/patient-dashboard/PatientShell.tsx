"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Calendar, Pill, CheckSquare, MessageCircle, Receipt, Home, LogOut, BookOpen } from "lucide-react";
import { clearPatientAuth, getPatientUser } from "../lib/auth/patient";
import styles from "./PatientDashboard.module.scss";

const NAV = [
  { href: "/patient-dashboard", label: "Home", icon: Home },
  { href: "/patient-dashboard/wellness", label: "Wellness", icon: Heart },
  { href: "/patient-dashboard/journals", label: "Journal", icon: BookOpen },
  { href: "/patient-dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/patient-dashboard/prescriptions", label: "Medicines", icon: Pill },
  { href: "/patient-dashboard/appointments", label: "Appointments", icon: Calendar },
  { href: "/patient-dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/patient-dashboard/billing", label: "Billing", icon: Receipt },
];

export default function PatientShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ username: string } | null>(null);

  useEffect(() => {
    const u = getPatientUser();
    if (!u) {
      router.push("/signin?redirect=/patient-dashboard");
      return;
    }
    setUser(u);
  }, [router]);

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
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`${styles.navButton} ${pathname === href ? styles.active : ""}`}>
              <Icon className="h-4 w-4" /> <span>{label}</span>
            </Link>
          ))}
        </aside>
        <section className={styles.workspace}>{children}</section>
      </main>
    </div>
  );
}
