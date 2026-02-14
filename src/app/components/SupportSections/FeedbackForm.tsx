"use client";

import { useState } from "react";
import { api, ApiError } from "../../lib/api";
import Link from "next/link";

const MIN_LENGTH = 10;

export function FeedbackForm() {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = feedback.trim();
    if (!trimmed || trimmed.length < MIN_LENGTH) {
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

  return (
    <>
      <p className="formIntro">
        Your experience matters. Tell us what&apos;s working, what could be better, or what you&apos;d like to see next.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="formGroup">
          <label htmlFor="feedback-text" className="formLabel">
            Your feedback <span className="text-destructive">*</span>
          </label>
          <textarea
            id="feedback-text"
            className="formTextarea"
            value={feedback}
            onChange={(e) => {
              setFeedback(e.target.value);
              setError(null);
            }}
            placeholder="Share your thoughts..."
            required
            minLength={MIN_LENGTH}
            rows={4}
          />
          <p className="formHint">At least {MIN_LENGTH} characters.</p>
        </div>
        {error && <div className="formError">{error}</div>}
        {success && <div className="formSuccess">Thank you! Your feedback has been submitted.</div>}
        <button type="submit" className="formSubmit" disabled={isSubmitting || !feedback.trim()}>
          {isSubmitting ? "Submitting..." : "Submit feedback"}
        </button>
      </form>
      <p className="formFooter">
        For specific issues or questions, use <Link href="/contact">Contact us</Link> or the <Link href="/faq">FAQ</Link>.
      </p>
    </>
  );
}
