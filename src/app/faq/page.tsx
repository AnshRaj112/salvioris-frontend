"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./FAQ.module.scss";

type ViewMode = "user" | "therapist";

export default function FAQPage() {
  const [mode, setMode] = useState<ViewMode>("user");

  return (
    <div className={`${styles.faqPage} ${mode === "user" ? styles.userMode : styles.therapistMode}`}>
      <div className={styles.navContainer}>
        <h1 className={styles.title}>Frequently Asked Questions</h1>

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
            <div className={styles.faqItem}>
              <h3>How do I create an account?</h3>
              <div>
                Go to <Link href="/signup">Sign up</Link>, enter your details, and follow the steps.
                Your data is kept private and secure.
              </div>
            </div>

            <div className={styles.faqItem}>
              <h3>Is my information private?</h3>
              <div>
                Yes. We are completely committed to privacy. All sessions and personal information are
                handled in strict accordance with our <Link href="/privacy">Privacy Policy</Link>.
              </div>
            </div>

            <div className={styles.faqItem}>
              <h3>How do I find a therapist?</h3>
              <div>
                After signing in, you can explore the platform and connect with licensed professionals
                using the matching tools available in your dashboard.
              </div>
            </div>

            <div className={styles.faqItem}>
              <h3>What if I need help right now?</h3>
              <div>
                If you&apos;re in crisis, please call <strong>14416</strong> or emergency <strong>108</strong> immediately.
                For non-urgent support, visit our <Link href="/help">Help Center</Link>.
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className={styles.faqItem}>
              <h3>How do I join the network?</h3>
              <div>
                Complete the application at <Link href="/therapist-signup">Join our network</Link>.
                You&apos;ll need to provide your license details, education history, and relevant documents.
              </div>
            </div>

            <div className={styles.faqItem}>
              <h3>How long does verification take?</h3>
              <div>
                We aim to review applications within a few business days. You&apos;ll receive an email notification
                once your account is approved or if we require additional information.
              </div>
            </div>

            <div className={styles.faqItem}>
              <h3>What documents do I need?</h3>
              <div>
                Typically, you will need a valid professional license/certificate and proof of degree.
                Exact requirements are listed on the application page.
              </div>
            </div>

            <div className={styles.faqItem}>
              <h3>Who do I contact for partner support?</h3>
              <div>
                Email <a href="mailto:support@salvioris.com">support@salvioris.com</a> with &quot;Therapist support&quot;
                in the subject line, or use our <Link href="/contact">Contact form</Link>.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Link href="/" className={styles.backLink}>← Back to Home</Link>
      </div>
    </div>
  );
}
