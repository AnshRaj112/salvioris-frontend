"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { api, ApiError } from "../lib/api";
import styles from "./ContactPage.module.scss";

const MIN_MESSAGE_LENGTH = 10;

export default function ContactPageClient() {
  const [isTherapist, setIsTherapist] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const eMail = email.trim();
    const msg = message.trim();
    if (!n) {
      setError("Please enter your name.");
      return;
    }
    if (!eMail) {
      setError("Please enter your email.");
      return;
    }
    if (!msg || msg.length < MIN_MESSAGE_LENGTH) {
      setError(`Message must be at least ${MIN_MESSAGE_LENGTH} characters.`);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await api.submitContact({ name: n, email: eMail, message: msg });
      if (response.success) {
        setName("");
        setEmail("");
        setMessage("");
        setSuccess(true);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to send. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageClass = isTherapist ? `${styles.page} ${styles.pageTherapist}` : styles.page;
  const cardClass = isTherapist ? `${styles.card} ${styles.cardTherapist}` : styles.card;

  if (success) {
    return (
      <div className={pageClass}>
        <div className={styles.cardWrap}>
          <Link href="/" className={isTherapist ? styles.backLinkTherapist : styles.backLink} aria-label="Back to home">
            <ArrowLeft className={styles.backIcon} />
          </Link>
          <div className={cardClass}>
            <div className={styles.body}>
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <CheckCircle
                  style={{
                    width: 48,
                    height: 48,
                    marginBottom: "1rem",
                    color: isTherapist ? "#6b4c93" : "#68d391",
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: isTherapist ? "#6b4c93" : "#68d391",
                  }}
                >
                  Thank you! We&apos;ll get back to you soon.
                </p>
              </div>
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

      <div className={styles.cardWrap}>
        <Link href="/" className={isTherapist ? styles.backLinkTherapist : styles.backLink} aria-label="Back to home">
          <ArrowLeft className={styles.backIcon} />
        </Link>
        <div className={cardClass}>
          <div className={styles.body}>
            <h1 className={isTherapist ? styles.titleTherapist : styles.title}>Contact Us</h1>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="contact-name" className={isTherapist ? styles.labelTherapist : styles.label}>
                  Name <span className={isTherapist ? styles.requiredTherapist : styles.required}>*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  className={isTherapist ? styles.inputTherapist : styles.input}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="contact-email" className={isTherapist ? styles.labelTherapist : styles.label}>
                  Email <span className={isTherapist ? styles.requiredTherapist : styles.required}>*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  className={isTherapist ? styles.inputTherapist : styles.input}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="contact-message" className={isTherapist ? styles.labelTherapist : styles.label}>
                  Message <span className={isTherapist ? styles.requiredTherapist : styles.required}>*</span>
                </label>
                <textarea
                  id="contact-message"
                  className={isTherapist ? styles.textareaTherapist : styles.textarea}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setError(null);
                  }}
                  placeholder="How can we help you?"
                  required
                  minLength={MIN_MESSAGE_LENGTH}
                  rows={4}
                />
                <p className={isTherapist ? styles.hintTherapist : styles.hint}>
                  Minimum {MIN_MESSAGE_LENGTH} characters
                </p>
              </div>

              {error && <div className={styles.errorMessage}>{error}</div>}

              <button
                type="submit"
                className={isTherapist ? styles.submitBtnTherapist : styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
