"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowRight, Shield, Users, Sparkles, Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import Image from "next/image";
import salviorisLogo from "../../assets/salvioris.jpg";
import { api, ApiError } from "../lib/api";
import styles from "./Signup.module.scss";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    recoveryEmail: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate username format
  const validateUsername = (username: string): string | null => {
    if (username.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (username.length > 20) {
      return "Username must be at most 20 characters";
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return "Username can only contain letters, numbers, and underscores";
    }
    if (!/^[a-zA-Z0-9]/.test(username)) {
      return "Username must start with a letter or number";
    }
    return null;
  };

  // Check username availability
  const checkUsername = async (username: string) => {
    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      setUsernameAvailable(false);
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError(null);
    
    try {
      const response = await api.checkUsername({ username });
      setUsernameAvailable(response.available);
      if (!response.available) {
        setUsernameError("Username is already taken");
      }
    } catch (err) {
      const apiError = err as ApiError;
      setUsernameError(apiError.message || "Failed to check username");
      setUsernameAvailable(false);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Debounced username check
  useEffect(() => {
    if (formData.username.length >= 3) {
      const timer = setTimeout(() => {
        checkUsername(formData.username);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setUsernameAvailable(null);
      setUsernameError(null);
    }
  }, [formData.username]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate password
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Check username one more time
    if (usernameAvailable === false) {
      setError("Please choose an available username");
      setIsLoading(false);
      return;
    }

    try {
      const signupData = {
        username: formData.username,
        password: formData.password,
        recovery_email: formData.recoveryEmail || undefined,
      };

      const response = await api.privacySignup(signupData);
      if (response.success) {
        // Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(response.user));
        // Redirect to home
        router.push("/");
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.signupPage}>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          {/* Story Section */}
          <div className={styles.storySection}>
            <div className={styles.storyContent}>
              <div className={styles.logoWrapper}>
                <div className={styles.logoIcon}>
                  <Image 
                    src={salviorisLogo} 
                    alt="Salvioris Logo" 
                    width={48} 
                    height={48}
                    className={styles.logoImage}
                  />
                </div>
                <h1 className={styles.brandName}>Salvioris</h1>
              </div>
              
              <h2 className={styles.storyTitle}>
                Your Journey to <span className={styles.highlight}>Wellness</span> Begins Here
              </h2>
              
              <p className={styles.storyDescription}>
                Every step forward is a victory. Every conversation is progress. 
                Join thousands who have found their path to healing and growth.
              </p>

              <div className={styles.featuresList}>
                <div className={styles.featureItem}>
                  <Shield className={styles.featureIcon} />
                  <div>
                    <h3 className={styles.featureTitle}>Secure & Private</h3>
                    <p className={styles.featureText}>Your data is encrypted and protected</p>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <Users className={styles.featureIcon} />
                  <div>
                    <h3 className={styles.featureTitle}>Expert Therapists</h3>
                    <p className={styles.featureText}>Licensed professionals ready to help</p>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <Sparkles className={styles.featureIcon} />
                  <div>
                    <h3 className={styles.featureTitle}>Personalized Care</h3>
                    <p className={styles.featureText}>Tailored to your unique needs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className={styles.formSection}>
            <Card className={styles.formCard}>
              <CardHeader>
                <CardTitle className={styles.formTitle}>
                  Create Your Anonymous Account
                </CardTitle>
                <p className={styles.formSubtitle}>
                  Start your healing journey today. Your privacy is our priority.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className={styles.form}>
                  {error && (
                    <div className={styles.errorMessage} style={{ color: 'red', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee', borderRadius: '4px' }}>
                      {error}
                    </div>
                  )}

                  {/* Privacy Warning */}
                  <div style={{ 
                    marginBottom: '1.5rem', 
                    padding: '1rem', 
                    backgroundColor: '#fff3cd', 
                    borderRadius: '8px',
                    border: '1px solid #ffc107'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <AlertTriangle style={{ color: '#856404', flexShrink: 0, marginTop: '2px' }} size={20} />
                      <div>
                        <strong style={{ color: '#856404', display: 'block', marginBottom: '0.25rem' }}>
                          Privacy Reminder
                        </strong>
                        <p style={{ color: '#856404', fontSize: '0.875rem', margin: 0 }}>
                          <strong>Do not use your real name</strong> in your username. Choose a unique, anonymous username to protect your privacy. Your username will be visible to others on the platform.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="username" className={styles.label}>
                      Username
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="Choose a unique username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className={styles.input}
                        style={{
                          paddingRight: '2.5rem'
                        }}
                      />
                      {formData.username.length >= 3 && (
                        <div style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          {isCheckingUsername ? (
                            <span style={{ fontSize: '0.75rem', color: '#666' }}>Checking...</span>
                          ) : usernameAvailable === true ? (
                            <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
                          ) : usernameAvailable === false ? (
                            <XCircle size={20} style={{ color: '#ef4444' }} />
                          ) : null}
                        </div>
                      )}
                    </div>
                    {usernameError && (
                      <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {usernameError}
                      </p>
                    )}
                    {!usernameError && formData.username.length >= 3 && usernameAvailable === true && (
                      <p style={{ color: '#22c55e', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Username is available!
                      </p>
                    )}
                    <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      3-20 characters, letters, numbers, and underscores only
                    </p>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="password" className={styles.label}>
                      Password
                    </label>
                    <div className={styles.passwordWrapper}>
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
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
                    <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Minimum 8 characters
                    </p>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="confirmPassword" className={styles.label}>
                      Confirm Password
                    </label>
                    <div className={styles.passwordWrapper}>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
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
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="recoveryEmail" className={styles.label}>
                      Recovery Email <span style={{ color: '#666', fontWeight: 'normal' }}>(Optional but recommended)</span>
                    </label>
                    <Input
                      id="recoveryEmail"
                      name="recoveryEmail"
                      type="email"
                      placeholder="your@email.com (for account recovery)"
                      value={formData.recoveryEmail}
                      onChange={handleChange}
                      className={styles.input}
                    />
                    <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Used only for account recovery. Never shown publicly.
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    variant="healing" 
                    className={styles.submitButton}
                    size="lg"
                    disabled={isLoading || usernameAvailable === false || isCheckingUsername}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                    <ArrowRight className={styles.buttonIcon} />
                  </Button>

                  <div className={styles.divider}>
                    <span>or</span>
                  </div>

                  <Link href="/therapist-signup" className={styles.therapistLink}>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className={styles.therapistButton}
                      size="lg"
                    >
                      Sign Up as Therapist
                    </Button>
                  </Link>

                  <p className={styles.loginLink}>
                    Already have an account?{" "}
                    <Link href="/signin" className={styles.link}>
                      Sign In
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
