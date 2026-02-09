"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Shield, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import salviorisLogo from "../../assets/salvioris.jpg";
import { api, ApiError } from "../lib/api";
import styles from "./AdminLogin.module.scss";

export default function AdminLoginPage() {
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
      const response = await api.adminSignin(formData);

      if (response.success) {
        // Store admin data in localStorage
        localStorage.setItem("admin", JSON.stringify(response.admin));
        // Redirect to admin dashboard
        router.push("/admin");
      } else {
        throw new Error(response.message || "Failed to sign in");
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.adminLoginPage}>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          {/* Left side - Branding */}
          <div className={styles.brandSection}>
            <div className={styles.brandContent}>
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

              <h2 className={styles.brandTitle}>
                Admin <span className={styles.highlight}>Portal</span>
              </h2>

              <p className={styles.brandDescription}>
                Secure access to the administrative dashboard. Manage therapists, users, and platform settings.
              </p>

              <div className={styles.featuresList}>
                <div className={styles.featureItem}>
                  <Shield className={styles.featureIcon} />
                  <div className={styles.featureContent}>
                    <h3 className={styles.featureTitle}>Secure Access</h3>
                    <p className={styles.featureText}>Protected admin authentication</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className={styles.formSection}>
            <Card className={styles.formCard}>
              <CardHeader>
                <CardTitle className={styles.formTitle}>Admin Sign In</CardTitle>
                <p className={styles.formSubtitle}>
                  Enter your credentials to access the admin dashboard
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
                    <label htmlFor="username" className={styles.label}>
                      Username
                    </label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter your username"
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
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        className={styles.input}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={styles.eyeButton}
                      >
                        {showPassword ? (
                          <EyeOff className={styles.eyeIcon} />
                        ) : (
                          <Eye className={styles.eyeIcon} />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={styles.submitButton}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

