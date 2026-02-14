"use client";

import { useState } from "react";
import { api, ApiError } from "../../lib/api";
import Link from "next/link";

const MIN_LENGTH = 10;

export function TherapistFeedbackForm() {
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
        We value input from our therapist partners. Share ideas about tools, workflows, or platform features.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="formGroup">
          <label htmlFor="therapist-feedback-text" className="formLabel">
            Your feedback <span style={{ color: "#b91c1c" }}>*</span>
          </label>
          <textarea
            id="therapist-feedback-text"
            className="formTextarea"
            value={feedback}
            onChange={(e) => {
              setFeedback(e.target.value);
              setError(null);
            }}
            placeholder="Share your suggestions..."
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
        For support requests, see <Link href="/contact">Contact us</Link> and the <Link href="/faq">FAQ</Link>.
      </p>
    </>
  );
}
