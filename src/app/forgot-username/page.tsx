"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { api, ApiError } from "../lib/api";
import styles from "./ForgotUsername.module.scss";

export default function ForgotUsernamePage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.forgotUsername({ recovery_email: email });
      if (response.success) {
        setSuccess(true);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to process request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.forgotPage}>
      <div className={styles.container}>
        <Card className={styles.card}>
          <CardHeader>
            <CardTitle>Recover Your Username</CardTitle>
            <p className={styles.subtitle}>
              Enter your recovery email address and we&apos;ll send you your username.
            </p>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className={styles.successMessage}>
                <CheckCircle className={styles.successIcon} />
                <h3>Check Your Email</h3>
                <p>
                  If an account exists with this email, you will receive your username via email.
                  Please check your inbox (and spam folder).
                </p>
                <Link href="/signin">
                  <Button variant="healing">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                {error && (
                  <div className={styles.errorMessage}>
                    {error}
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Recovery Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={styles.input}
                  />
                  <p className={styles.helpText}>
                    Enter the email address you used when creating your account.
                  </p>
                </div>
                <Button
                  type="submit"
                  variant="healing"
                  className={styles.submitButton}
                  disabled={isLoading}
                >
                  <Mail className={styles.buttonIcon} />
                  {isLoading ? "Sending..." : "Send Username"}
                </Button>
                <Link href="/signin" className={styles.backLink}>
                  <ArrowLeft className={styles.backIcon} />
                  Back to Sign In
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

