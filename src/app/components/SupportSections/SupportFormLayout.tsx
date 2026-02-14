"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import styles from "./SupportSections.module.scss";

type Tab = "user" | "therapist";

type Props = {
  pageTitle: string;
  userTitle: string;
  userContent: ReactNode;
  therapistTitle: string;
  therapistContent: ReactNode;
};

export function SupportFormLayout({
  pageTitle,
  userTitle,
  userContent,
  therapistTitle,
  therapistContent,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("user");

  const isUser = activeTab === "user";

  return (
    <div className={styles.formPageWrapper}>
      <section
        className={isUser ? styles.userSection : styles.therapistSection}
        aria-label={`${pageTitle} — ${isUser ? "for users" : "for therapists"}`}
      >
        <div className={isUser ? styles.userContainer : styles.therapistContainer}>
          {/* Toggle */}
          <div className={styles.toggleWrapper}>
            <div className={styles.toggleTrack} role="tablist" aria-label="I am a...">
              <button
                type="button"
                role="tab"
                aria-selected={isUser}
                className={`${styles.toggleOption} ${isUser ? styles.toggleOptionActive : ""} ${styles.toggleUser}`}
                onClick={() => setActiveTab("user")}
              >
                I&apos;m a User
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isUser}
                className={`${styles.toggleOption} ${!isUser ? styles.toggleOptionActive : ""} ${styles.toggleTherapist}`}
                onClick={() => setActiveTab("therapist")}
              >
                I&apos;m a Therapist
              </button>
            </div>
          </div>

          {/* Card with form */}
          <div className={isUser ? styles.userCard : styles.therapistCard}>
            <span className={isUser ? styles.userBadge : styles.therapistBadge}>
              {isUser ? "For users" : "For therapists"}
            </span>
            <h1 className={isUser ? styles.userTitle : styles.therapistTitle}>
              {isUser ? userTitle : therapistTitle}
            </h1>
            <div className={isUser ? styles.userContent : styles.therapistContent}>
              {isUser ? userContent : therapistContent}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
