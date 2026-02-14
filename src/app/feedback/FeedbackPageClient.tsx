"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, ArrowLeft, CheckCircle } from "lucide-react";
import { api, ApiError } from "../lib/api";
import styles from "./FeedbackPage.module.scss";

const MIN_LENGTH = 10;

export default function FeedbackPageClient() {
  const [isTherapist, setIsTherapist] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = feedback.trim();
    if (!trimmed) {
      setSuccess(true);
      return;
    }
    if (trimmed.length < MIN_LENGTH) {
      setError(`Please enter at least ${MIN_LENGTH} characters.`);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await api.submitFeedback({ feedback: trimmed });
      if (response.success) {
        setFeedback("");
        setSuccess(true);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageClass = isTherapist ? `${styles.page} ${styles.pageTherapist}` : styles.page;
  const cardClass = isTherapist ? `${styles.card} ${styles.cardTherapist}` : styles.card;

  if (success) {
    return (
      <div className={pageClass}>
        <div className={cardClass}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <Star className={isTherapist ? styles.starIconTherapist : styles.starIcon} />
              <h1 className={isTherapist ? styles.titleTherapist : styles.title}>We&apos;d Love Your Feedback!</h1>
            </div>
            <Link href="/" className={isTherapist ? styles.backLinkTherapist : styles.backLink} aria-label="Back">
              <ArrowLeft className={styles.backIcon} />
            </Link>
          </div>
          <div className={styles.body}>
            <div className={styles.successBlock}>
              <CheckCircle className={isTherapist ? styles.successIconTherapist : styles.successIcon} />
              <p className={isTherapist ? styles.successTitleTherapist : styles.successTitle}>Thank you for your feedback!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <div className={styles.toggleWrap}>
        <div className={styles.toggleTrack} role="tablist" aria-label="I am a...">
          <button
            type="button"
            role="tab"
            aria-selected={!isTherapist}
            className={`${styles.toggleOption} ${!isTherapist ? styles.toggleActive : ""} ${styles.toggleUser}`}
            onClick={() => setIsTherapist(false)}
          >
            I&apos;m a User
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isTherapist}
            className={`${styles.toggleOption} ${isTherapist ? styles.toggleActive : ""} ${styles.toggleTherapist}`}
            onClick={() => setIsTherapist(true)}
          >
            I&apos;m a Therapist
          </button>
        </div>
      </div>

      <div className={cardClass}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Star className={isTherapist ? styles.starIconTherapist : styles.starIcon} />
            <h1 className={isTherapist ? styles.titleTherapist : styles.title}>We&apos;d Love Your Feedback!</h1>
          </div>
          <Link href="/" className={isTherapist ? styles.backLinkTherapist : styles.backLink} aria-label="Back to home">
            <ArrowLeft className={styles.backIcon} />
          </Link>
        </div>

        <div className={styles.body}>
          <p className={isTherapist ? styles.introTherapist : styles.intro}>
            We know you&apos;re going through a lot right now, and we&apos;re here for you.
            If you can spare just a minute, we&apos;d love to know where we can improve so you can feel much better.
            Your voice matters, and with your help, we can make SALVIORIS a more supportive space for everyone.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="feedback-text" className={isTherapist ? styles.labelTherapist : styles.label}>
                Your Feedback
              </label>
              <textarea
                id="feedback-text"
                className={isTherapist ? styles.textareaTherapist : styles.textarea}
                value={feedback}
                onChange={(e) => {
                  setFeedback(e.target.value);
                  setError(null);
                }}
                placeholder="Tell us what you think... What can we improve? What features would you like to see?"
                rows={5}
              />
              <p className={isTherapist ? styles.helperTextTherapist : styles.helperText}>
                Optional. Be as detailed as you&apos;d like!
              </p>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <button
              type="submit"
              className={isTherapist ? styles.submitBtnTherapist : styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Leave Feedback"}
            </button>

            <p className={isTherapist ? styles.privacyNoteTherapist : styles.privacyNote}>
              <strong>Note:</strong> Your feedback is anonymous and will only be used to improve our services.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
