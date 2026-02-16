"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Help.module.scss";

type ViewMode = "user" | "therapist";

export default function HelpCenterPage() {
  const [mode, setMode] = useState<ViewMode>("user");

  return (
    <div className={`${styles.helpPage} ${mode === "user" ? styles.userMode : styles.therapistMode}`}>
      <div className={styles.navContainer}>
        <h1 className={styles.title}>Help Center</h1>

        <div className={styles.toggleContainer}>
          <button
            className={`${styles.toggleButton} ${mode === "user" ? styles.active : ""}`}
            onClick={() => setMode("user")}
          >
            For Users
          </button>
          <button
            className={`${styles.toggleButton} ${mode === "therapist" ? styles.active : ""}`}
            onClick={() => setMode("therapist")}
          >
            For Therapists
          </button>
        </div>
      </div>

      <div className={styles.contentContainer} key={mode}>
        {mode === "user" ? (
          <div>
            <h2>User Support</h2>
            <p>
              Welcome to the Help Center. Here you can find resources to guide you through your journey
              on Serenify.
            </p>

            <h3>Quick Links</h3>
            <ul>
              <li>
                <Link href="/faq">FAQ</Link> — Find answers to common questions about your account, sessions, and privacy.
              </li>
              <li>
                <Link href="/contact">Contact Support</Link> — Reach out to our dedicated support team via email or form.
              </li>
              <li>
                <Link href="/feedback">Share Feedback</Link> — We value your input. Let us know how we can improve.
              </li>
            </ul>

            <h3>Emergency Resources</h3>
            <p>
              If you or someone you know is in immediate danger, please do not use this site.
              <strong> Call 14416 or 108 immediately.</strong>
            </p>
          </div>
        ) : (
          <div>
            <h2>Therapist Resources</h2>
            <p>
              Support and tools designed to help you manage your practice and connect with clients effectively.
            </p>

            <h3>Quick Links</h3>
            <ul>
              <li>
                <Link href="/faq">Therapist FAQ</Link> — Information on joining the network, verification processes, and scheduling.
              </li>
              <li>
                <Link href="/contact">Partner Support</Link> — Specific support channels for technical or administrative issues.
              </li>
              <li>
                <Link href="/therapist-signup">Join Network</Link> — Application process for new therapists.
              </li>
            </ul>

            <h3>Administrative Assistance</h3>
            <p>
              For urgent account or billing issues, please use the priority contact form in your dashboard
              or email our partner support line directly.
            </p>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Link href="/" className={styles.backLink}>← Back to Home</Link>
      </div>
    </div>
  );
}
