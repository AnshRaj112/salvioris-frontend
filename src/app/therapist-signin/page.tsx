"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowRight, Shield, Users, Award, LogIn, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import salviorisLogo from "../../assets/salvioris.jpg";
import { api, ApiError } from "../lib/api";
import styles from "./TherapistSignin.module.scss";

export default function TherapistSigninPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
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
      const response = await api.therapistSignin(formData);
      if (response.success) {
        // Store therapist data in localStorage
        localStorage.setItem("therapist", JSON.stringify(response.user));
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
    <div className={styles.therapistSigninPage}>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          {/* Story Section */}
          <div className={styles.storySection}>
            <div className={styles.storyContent}>
              <div className={styles.logoWrapper}>
                <div className={styles.logoIcon}>
                  <Image 
                    src={salviorisLogo} 
                    alt="SALVIORIS Logo" 
                    width={48} 
                    height={48}
                    className={styles.logoImage}
                  />
                </div>
                <h1 className={styles.brandName}>SALVIORIS</h1>
              </div>
              
              <h2 className={styles.storyTitle}>
                Welcome <span className={styles.highlight}>Back</span>, Therapist
              </h2>
              
              <p className={styles.storyDescription}>
                Your journey to help others continues here. Sign in to access your dashboard, 
                manage your clients, and continue making a difference in people&apos;s lives.
              </p>

              <div className={styles.featuresList}>
                <div className={styles.featureItem}>
                  <Shield className={styles.featureIcon} />
                  <div>
                    <h3 className={styles.featureTitle}>Your Professional Dashboard</h3>
                    <p className={styles.featureText}>Access all your tools and resources</p>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <Users className={styles.featureIcon} />
                  <div>
                    <h3 className={styles.featureTitle}>Manage Your Clients</h3>
                    <p className={styles.featureText}>Continue supporting those in your care</p>
                  </div>
                </div>
                <div className={styles.featureItem}>
                  <Award className={styles.featureIcon} />
                  <div>
                    <h3 className={styles.featureTitle}>Track Your Impact</h3>
                    <p className={styles.featureText}>See the difference you&apos;re making</p>
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
                    <label htmlFor="email" className={styles.label}>
                      Email Address
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
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

                  <div className={styles.forgotPassword}>
                    <Link href="/therapist-forgot-password" className={styles.forgotLink}>
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

                  <p className={styles.signupLink}>
                    Don&apos;t have an account?{" "}
                    <Link href="/therapist-signup" className={styles.link}>
                      Apply Now
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

