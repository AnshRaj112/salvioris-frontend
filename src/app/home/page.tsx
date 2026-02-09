"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { api, ApiError, Journal } from "../lib/api";
import styles from "./Home.module.scss";

interface User {
  id: string;
  username: string;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [isLoadingJournals, setIsLoadingJournals] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/signup?redirect=/home");
      return;
    }

    try {
      const parsed = JSON.parse(userData);
      setUser(parsed);
    } catch {
      localStorage.removeItem("user");
      router.push("/signup?redirect=/home");
      return;
    }
  }, [router]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        setIsLoadingJournals(true);
        const response = await api.getJournals(user.id, 3, 0);
        if (response.success) {
          setJournals(response.journals);
        }
      } catch (err) {
        // Non-critical, so just log
        console.error("Failed to load journals on home:", err as ApiError);
      } finally {
        setIsLoadingJournals(false);
      }
    };

    load();
  }, [user?.id]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmittingFeedback(true);
    setFeedbackMessage(null);
    setFeedbackError(null);

    try {
      const response = await api.submitFeedback({ feedback: feedback.trim() });
      if (response.success) {
        setFeedback("");
        setFeedbackMessage("Thank you for your feedback!");
      }
    } catch (err) {
      const apiError = err as ApiError;
      setFeedbackError(apiError.message || "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className={styles.homePage}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div className={styles.header}>
            <h1 className={styles.title}>Welcome back, {user?.username ?? "friend"}</h1>
            <p className={styles.subtitle}>
              Choose how you want to release what you&apos;re feeling right now—vent
              freely or journal quietly, with your past reflections close by.
            </p>
          </div>
        </div>

        <div className={styles.cardRow}>
          <div className={styles.ventCard}>
            <div className={styles.cardTitle}>Vent Out</div>
            <div className={styles.cardText}>
              Share what&apos;s on your mind in the venting space—fast, raw, and
              without judgment.
            </div>
            <Button asChild variant="healing">
              <Link href="/vent">Go to Venting</Link>
            </Button>
          </div>

          <div className={styles.journalCard}>
            <div className={styles.cardTitle}>Journaling</div>
            <div className={styles.cardText}>
              Move into a calmer space where you can write, reflect, and revisit
              your past entries.
            </div>
            <Button
              asChild
              variant="healing"
            >
              <Link
                href={
                  user?.id ? "/journaling" : "/signup?redirect=/journaling"
                }
              >
                Open Journaling
              </Link>
            </Button>

            <div className={styles.journalsList}>
              {user && (isLoadingJournals ? (
                <div className={styles.emptyText}>Loading your recent journals…</div>
              ) : journals.length === 0 ? (
                <div className={styles.emptyText}>
                  You haven&apos;t written any journals yet. Your first entry will show up here.
                </div>
              ) : (
                journals.map((journal) => (
                  <button
                    key={journal.id}
                    type="button"
                    className={styles.journalItem}
                    onClick={() => {
                      setSelectedJournal(journal);
                      setShowJournalModal(true);
                    }}
                  >
                    <div className={styles.journalTitle}>
                      {journal.title && journal.title.trim().length > 0
                        ? journal.title
                        : "Untitled journal"}
                    </div>
                    <div className={styles.journalDate}>
                      {formatDate(journal.created_at)}
                    </div>
                  </button>
                ))
              ))}
              {!user && (
                <div className={styles.emptyText}>
                  Create a free anonymous account to save journals and see them here.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.feedbackSection}>
          <h2 className={styles.feedbackTitle}>Leave Feedback</h2>
          <p className={styles.feedbackSubtitle}>
            Share a quick thought about your experience on this page so we can keep improving it.
          </p>
          <form onSubmit={handleFeedbackSubmit} className={styles.feedbackForm}>
            <Textarea
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value);
                setFeedbackMessage(null);
                setFeedbackError(null);
              }}
              rows={4}
              placeholder="Tell us what feels helpful or what could be better..."
              className={styles.feedbackTextarea}
            />
            <div className={styles.feedbackActions}>
              <Button
                type="submit"
                variant="healing"
                disabled={isSubmittingFeedback || !feedback.trim()}
              >
                {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
            {feedbackMessage && (
              <div className={styles.feedbackMessage}>{feedbackMessage}</div>
            )}
            {feedbackError && (
              <div className={styles.feedbackError}>{feedbackError}</div>
            )}
          </form>
        </div>
      </div>

      {selectedJournal && showJournalModal && (
        <div
          className={styles.modal}
          onClick={() => setShowJournalModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {selectedJournal.title && selectedJournal.title.trim().length > 0
                  ? selectedJournal.title
                  : "Untitled journal"}
              </h2>
              <span className={styles.modalDate}>
                {formatDate(selectedJournal.created_at)}
              </span>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                {selectedJournal.content || "No content saved for this journal."}
              </p>
            </div>
            <div className={styles.modalActions}>
              <Button variant="healing" onClick={() => setShowJournalModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


