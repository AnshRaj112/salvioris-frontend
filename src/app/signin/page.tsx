"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowRight, Shield, Users, Sparkles, LogIn, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import salviorisLogo from "../../assets/salvioris.jpg";
import { api, ApiError } from "../lib/api";
import styles from "./Signin.module.scss";

export default function SigninPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    try {
      const response = await api.privacySignin(formData);
      if (response.success) {
        // Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(response.user));
        // Redirect to dashboard or home
        router.push("/");
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.signinPage}>
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
                Welcome <span className={styles.highlight}>Back</span>
              </h2>
              
              <p className={styles.storyDescription}>
                Your journey continues here. We&apos;re here to support you every step of the way. 
                Sign in to reconnect with your therapist and continue your path to wellness.
              </p>

              <div className={styles.featuresList}>
                <div className={styles.featureItem}>
                  <Shield className={styles.featureIcon} />
                  <div>
                    <h3 className={styles.featureTitle}>Your Safe Space</h3>
                    <p className={styles.featureText}>All your conversations are secure and private</p>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <Users className={styles.featureIcon} />
                  <div>
                    <h3 className={styles.featureTitle}>Continue Your Journey</h3>
                    <p className={styles.featureText}>Pick up right where you left off</p>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <Sparkles className={styles.featureIcon} />
                  <div>
                    <h3 className={styles.featureTitle}>Track Your Progress</h3>
                    <p className={styles.featureText}>See how far you&apos;ve come</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className={styles.formSection}>
            <Card className={styles.formCard}>
              <CardHeader>
                <CardTitle className={styles.formTitle}>Sign In to Your Account</CardTitle>
                <p className={styles.formSubtitle}>
                  Welcome back! We&apos;re glad you&apos;re here.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className={styles.form}>
                  {error && (
                    <div className={styles.errorMessage} style={{ color: 'red', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee', borderRadius: '4px' }}>
                      {error}
                    </div>
                  )}
                  <div className={styles.formGroup}>
                    <label htmlFor="username" className={styles.label}>
                      Username
                    </label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      className={styles.input}
                    />
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
                        placeholder="Enter your password"
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
                  </div>

                  <div className={styles.forgotLinks}>
                    <Link href="/forgot-username" className={styles.forgotLink}>
                      Forgot your username?
                    </Link>
                    <Link href="/forgot-password" className={styles.forgotLink}>
                      Forgot your password?
                    </Link>
                  </div>

                  <Button 
                    type="submit" 
                    variant="healing" 
                    className={styles.submitButton}
                    size="lg"
                    disabled={isLoading}
                  >
                    <LogIn className={styles.buttonIcon} />
                    {isLoading ? "Signing In..." : "Sign In"}
                    <ArrowRight className={styles.buttonIcon} />
                  </Button>

                  <div className={styles.divider}>
                    <span>or</span>
                  </div>

                  <Link href="/therapist-signin" className={styles.therapistLink}>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className={styles.therapistButton}
                      size="lg"
                    >
                      Sign In as Therapist
                    </Button>
                  </Link>

                  <p className={styles.signupLink}>
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className={styles.link}>
                      Create Account
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
