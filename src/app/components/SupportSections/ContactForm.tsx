"use client";

import { useState } from "react";
import { api, ApiError } from "../../lib/api";
import Link from "next/link";

const MIN_MESSAGE_LENGTH = 10;

export function ContactForm() {
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

  return (
    <>
      <p className="formIntro">
        We&apos;re here to help. Reach out for account issues, technical support, or general questions.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="formGroup">
          <label htmlFor="contact-name" className="formLabel">
            Name <span className="text-destructive">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            className="formInput"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Your full name"
            required
          />
        </div>
        <div className="formGroup">
          <label htmlFor="contact-email" className="formLabel">
            Email <span className="text-destructive">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            className="formInput"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder="your@email.com"
            required
          />
        </div>
        <div className="formGroup">
          <label htmlFor="contact-message" className="formLabel">
            Message <span className="text-destructive">*</span>
          </label>
          <textarea
            id="contact-message"
            className="formTextarea"
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
          <p className="formHint">At least {MIN_MESSAGE_LENGTH} characters.</p>
        </div>
        {error && <div className="formError">{error}</div>}
        {success && <div className="formSuccess">Thank you! We&apos;ll get back to you soon.</div>}
        <button type="submit" className="formSubmit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send message"}
        </button>
      </form>
      <p className="formFooter">
        We aim to respond within 24–48 hours. For crisis support, call <strong>14416</strong> or <strong>108</strong>. You can also submit <Link href="/feedback">feedback</Link> or check the <Link href="/faq">FAQ</Link>.
      </p>
    </>
  );
}
