"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { MessageSquare, ArrowLeft, CheckCircle } from "lucide-react";
import { api, ApiError } from "../lib/api";
import styles from "./Feedback.module.scss";

export default function FeedbackPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      setError("Please provide your feedback");
      return;
    }

    if (feedback.trim().length < 10) {
      setError("Please provide more detailed feedback (at least 10 characters)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.submitFeedback({
        feedback: feedback.trim(),
      });

      if (response.success) {
        setIsSubmitted(true);
        setFeedback("");
        // Redirect after 3 seconds
        setTimeout(() => {
          router.push("/");
        }, 3000);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={styles.feedbackPage}>
        <div className={styles.container}>
          <Card className={styles.successCard}>
            <CardContent className={styles.successContent}>
              <CheckCircle className={styles.successIcon} />
              <h2 className={styles.successTitle}>Thank You for Your Feedback!</h2>
              <p className={styles.successMessage}>
                Your feedback has been received and will help us improve SALVIORIS. 
                We appreciate you taking the time to share your thoughts.
              </p>
              <Link href="/">
                <Button variant="healing" className={styles.backButton}>
                  Return to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.feedbackPage}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft className={styles.backIcon} />
          Back to Home
        </Link>

        <Card className={styles.feedbackCard}>
          <CardHeader>
            <div className={styles.headerContent}>
              <MessageSquare className={styles.headerIcon} />
              <CardTitle className={styles.title}>Share Your Feedback</CardTitle>
            </div>
            <p className={styles.subtitle}>
              Help us improve SALVIORIS by sharing your thoughts, suggestions, or areas where we can do better. 
              Your feedback is valuable to us.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="feedback" className={styles.label}>
                  Your Feedback <span className={styles.required}>*</span>
                </label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => {
                    setFeedback(e.target.value);
                    setError(null);
                  }}
                  placeholder="Tell us what you think... What can we improve? What features would you like to see? Any issues you've encountered?"
                  rows={8}
                  className={styles.textarea}
                  required
                />
                <p className={styles.helperText}>
                  Minimum 10 characters. Be as detailed as you&apos;d like - we read every feedback!
                </p>
              </div>

              <div className={styles.formActions}>
                <Button
                  type="submit"
                  variant="healing"
                  className={styles.submitButton}
                  disabled={isSubmitting || !feedback.trim()}
                  size="lg"
                >
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>

              <p className={styles.privacyNote}>
                <strong>Note:</strong> We don&apos;t collect personal information in this form. 
                Your feedback is anonymous and will only be used to improve our services.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

