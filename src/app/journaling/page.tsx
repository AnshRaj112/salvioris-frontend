"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { api, ApiError, Journal } from "../lib/api";
import styles from "./Journaling.module.scss";

interface User {
  id: string;
  username: string;
}

export default function JournalingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Ensure only logged-in users can access this page
  useEffect(() => {
    if (typeof window === "undefined") return;

    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/signup?redirect=/journaling");
      return;
    }

    try {
      const parsed = JSON.parse(userData);
      setUser(parsed);
    } catch {
      localStorage.removeItem("user");
      router.push("/signup?redirect=/journaling");
      return;
    }
  }, [router]);

  // Load existing journals
  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        setIsLoading(true);
        const response = await api.getJournals(user.id, 20, 0);
        if (response.success) {
          setJournals(response.journals);
        }
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || "Failed to load journals.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    if (!title.trim() && !content.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      const response = await api.createJournal({
        title: title.trim(),
        content: content.trim(),
        user_id: user.id,
      });
      if (response.success && response.journal) {
        setJournals((prev) => [response.journal!, ...prev]);
        setTitle("");
        setContent("");
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to save journal.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const getPreview = (journal: Journal) => {
    const base = journal.title?.trim()
      ? journal.title.trim()
      : journal.content.trim();
    if (!base) return "";
    return base.length > 80 ? `${base.slice(0, 80)}…` : base;
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
    <div className={styles.journalingPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>Your Journaling Space</h1>
            <Button
              variant="healing"
              size="sm"
              onClick={() => router.push("/home")}
            >
              Go to Home
            </Button>
          </div>
          <p className={styles.subtitle}>
            Capture your thoughts and feelings in a private space. Only you can
            see your journals.
          </p>
        </div>

        <div className={styles.journalForm}>
          <div>
            <label className={styles.label}>Title (optional)</label>
            <Input
              className={styles.input}
              placeholder="Give your journal a gentle title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className={styles.label}>Your Journal</label>
            <Textarea
              className={styles.textarea}
              placeholder="Write what’s on your mind today..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.actions}>
            <Button
              variant="healing"
              disabled={isSaving || (!title.trim() && !content.trim())}
              onClick={handleSave}
            >
              {isSaving ? "Saving..." : "Save Journal"}
            </Button>
          </div>
        </div>

        <div className={styles.journalsList}>
          <div className={styles.journalsHeaderRow}>
            <div className={styles.journalsTitle}>Previous Journals</div>
            <div className={styles.journalsMeta}>
              {isLoading
                ? "Loading..."
                : journals.length > 0
                ? `${journals.length} entr${journals.length === 1 ? "y" : "ies"}`
                : ""}
            </div>
          </div>

          {isLoading ? (
            <div className={styles.emptyState}>Loading your journals...</div>
          ) : journals.length === 0 ? (
            <div className={styles.emptyState}>
              No journals yet. Start by writing your first reflection above.
            </div>
          ) : (
            journals.map((journal) => (
              <button
                key={journal.id}
                type="button"
                className={`${styles.journalItem} ${
                  selectedJournal?.id === journal.id && showJournalModal
                    ? styles.journalItemActive
                    : ""
                }`}
                onClick={() => {
                  setSelectedJournal(journal);
                  setShowJournalModal(true);
                }}
              >
                <div className={styles.journalItemTitleRow}>
                  <div className={styles.journalTitle}>
                    {journal.title && journal.title.trim().length > 0
                      ? journal.title
                      : "Untitled journal"}
                  </div>
                  <div className={styles.journalDate}>
                    {formatDate(journal.created_at)}
                  </div>
                </div>
                <div className={styles.journalPreview}>
                  {getPreview(journal)}
                </div>
              </button>
            ))
          )}
        </div>

        <div className={styles.feedbackSection}>
          <h2 className={styles.feedbackTitle}>Leave Feedback</h2>
          <p className={styles.feedbackSubtitle}>
            Tell us how this journaling space feels for you or what could make it more supportive.
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
              placeholder="Share any thoughts about journaling here..."
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


