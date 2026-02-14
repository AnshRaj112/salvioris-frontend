"use client";

import { useState } from "react";
import { api, ApiError } from "../../lib/api";
import Link from "next/link";

const MIN_MESSAGE_LENGTH = 10;

export function TherapistContactForm() {
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
        Partner and technical support for therapists on the SALVIORIS network.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="formGroup">
          <label htmlFor="therapist-contact-name" className="formLabel">
            Name <span style={{ color: "#b91c1c" }}>*</span>
          </label>
          <input
            id="therapist-contact-name"
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
          <label htmlFor="therapist-contact-email" className="formLabel">
            Email <span style={{ color: "#b91c1c" }}>*</span>
          </label>
          <input
            id="therapist-contact-email"
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
          <label htmlFor="therapist-contact-message" className="formLabel">
            Message <span style={{ color: "#b91c1c" }}>*</span>
          </label>
          <textarea
            id="therapist-contact-message"
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
        We typically respond within 1–2 business days. For applications, see <Link href="/therapist-signup">Join our network</Link> and the <Link href="/faq">FAQ</Link>.
      </p>
    </>
  );
}
