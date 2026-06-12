"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { patientApi, PatientApiError } from "../lib/api/patient";
import styles from "./PatientDashboard.module.scss";

export default function PatientDashboardHome() {
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ tasks: 0, appointments: 0, invoices: 0 });

  useEffect(() => {
    Promise.all([
      patientApi.listTasks("pending"),
      patientApi.listAppointments(),
      patientApi.listInvoices("sent"),
    ])
      .then(([t, a, i]) => {
        setStats({
          tasks: t.data?.length || 0,
          appointments: a.data?.length || 0,
          invoices: i.data?.length || 0,
        });
      })
      .catch((e) => {
        const err = e as PatientApiError;
        if (err.status === 403) {
          setError("Your account is not linked to a therapist yet. Ask your therapist to onboard you.");
        } else {
          setError(err.message);
        }
      });
  }, []);

  return (
    <div className={styles.dashboardHome}>
      <div className={styles.hero}>
        <div>
          <h2 className={styles.title}>Welcome back</h2>
          <p className={styles.subtitle}>
            Track wellness, complete care tasks, review prescriptions, and message your therapist from one calm space.
          </p>
        </div>
        <span className={styles.statusPill}>Care dashboard</span>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.statGrid}>
        {[
          { label: "Pending tasks", value: stats.tasks, href: "/patient-dashboard/tasks" },
          { label: "Appointments", value: stats.appointments, href: "/patient-dashboard/appointments" },
          { label: "Outstanding bills", value: stats.invoices, href: "/patient-dashboard/billing" },
        ].map((s) => (
          <Link key={s.href} href={s.href} className={styles.statCard}>
            <p className={styles.statLabel}>{s.label}</p>
            <p className={styles.statValue}>{s.value}</p>
          </Link>
        ))}
      </div>

      <p className={styles.quickText}>
        Log daily wellness, complete homework, and message your therapist all in one place.
      </p>
    </div>
  );
}
