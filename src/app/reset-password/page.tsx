"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { api, ApiError } from "../lib/api";
import styles from "./ResetPassword.module.scss";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    hasNumber: false,
    hasLetter: false,
  });

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setError("Invalid reset link. Please request a new password reset.");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const validatePassword = (password: string) => {
    setPasswordStrength({
      length: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasLetter: /[a-zA-Z]/.test(password),
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError(null);
    
    if (name === "password") {
      validatePassword(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.resetPassword({
        token: token,
        new_password: formData.password,
      });
      
      if (response.success) {
        setSuccess(true);
        // Redirect to signin after 3 seconds
        setTimeout(() => {
          router.push("/signin");
        }, 3000);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to reset password. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordValid = passwordStrength.length && passwordStrength.hasNumber && passwordStrength.hasLetter;

  return (
    <div className={styles.resetPage}>
      <div className={styles.container}>
        <Card className={styles.card}>
          <CardHeader>
            <CardTitle>Create New Password</CardTitle>
            <p className={styles.subtitle}>
              Enter your new password below. Make sure it&apos;s strong and secure.
            </p>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className={styles.successMessage}>
                <CheckCircle className={styles.successIcon} />
                <h3>Password Reset Successful!</h3>
                <p>
                  Your password has been reset successfully. You will be redirected to the sign in page shortly.
                </p>
                <Link href="/signin">
                  <Button variant="healing">
                    Go to Sign In
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
                  <label htmlFor="password" className={styles.label}>
                    New Password
                  </label>
                  <div className={styles.passwordWrapper}>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className={styles.input}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.eyeButton}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className={styles.eyeIcon} />
                      ) : (
                        <Eye className={styles.eyeIcon} />
                      )}
                    </button>
                  </div>
                  
                  {formData.password && (
                    <div className={styles.passwordStrength}>
                      <div className={styles.strengthItem}>
                        {passwordStrength.length ? (
                          <CheckCircle className={styles.checkIcon} />
                        ) : (
                          <XCircle className={styles.xIcon} />
                        )}
                        <span>At least 8 characters</span>
                      </div>
                      <div className={styles.strengthItem}>
                        {passwordStrength.hasLetter ? (
                          <CheckCircle className={styles.checkIcon} />
                        ) : (
                          <XCircle className={styles.xIcon} />
                        )}
                        <span>Contains letters</span>
                      </div>
                      <div className={styles.strengthItem}>
                        {passwordStrength.hasNumber ? (
                          <CheckCircle className={styles.checkIcon} />
                        ) : (
                          <XCircle className={styles.xIcon} />
                        )}
                        <span>Contains numbers</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword" className={styles.label}>
                    Confirm New Password
                  </label>
                  <div className={styles.passwordWrapper}>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className={styles.input}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={styles.eyeButton}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className={styles.eyeIcon} />
                      ) : (
                        <Eye className={styles.eyeIcon} />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className={styles.errorText}>Passwords do not match</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="healing"
                  className={styles.submitButton}
                  disabled={isLoading || !isPasswordValid || !token}
                >
                  {isLoading ? "Resetting Password..." : "Reset Password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className={styles.resetPage}>
        <div className={styles.container}>
          <Card className={styles.card}>
            <CardContent>
              <p>Loading...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

