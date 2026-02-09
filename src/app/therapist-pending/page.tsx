"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Clock, CheckCircle, Mail, ArrowLeft } from "lucide-react";
import Image from "next/image";
import salviorisLogo from "../../assets/salvioris.jpg";
import { api, Therapist } from "../lib/api";
import styles from "./TherapistPending.module.scss";

export default function TherapistPendingPage() {
  const router = useRouter();
  const [therapistData, setTherapistData] = useState<Therapist | null>(null);

  useEffect(() => {
    // Get therapist data from localStorage
    const stored = localStorage.getItem("therapist");
    if (stored) {
      try {
        const data = JSON.parse(stored) as Therapist;
        setTherapistData(data);
      } catch (error) {
        console.error("Error parsing therapist data:", error);
        router.push("/therapist-signup");
      }
    } else {
      // If no data, redirect to signup
      router.push("/therapist-signup");
    }
  }, [router]);

  const handleCheckStatus = async () => {
    if (!therapistData?.email) return;
    
    try {
      const response = await api.checkTherapistStatus(therapistData.email);
      if (response.is_approved) {
        // Update localStorage
        const updatedTherapist: Therapist = { ...therapistData, is_approved: true };
        localStorage.setItem("therapist", JSON.stringify(updatedTherapist));
        // Show success message and redirect to signin
        alert("Great news! Your application has been approved. You can now sign in.");
        router.push("/therapist-signin");
      } else {
        alert("Your application is still pending approval. We'll notify you via email once it's reviewed.");
      }
    } catch (error) {
      console.error("Error checking status:", error);
      alert("Unable to check status. Please try again later.");
    }
  };

  return (
    <div className={styles.pendingPage}>
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          {/* Header */}
          <div className={styles.header}>
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
          </div>

          {/* Main Content */}
          <Card className={styles.pendingCard}>
            <CardHeader>
              <div className={styles.iconWrapper}>
                <Clock className={styles.pendingIcon} />
              </div>
              <CardTitle className={styles.title}>
                Application Under Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.content}>
                <p className={styles.message}>
                  Thank you for submitting your therapist application,{" "}
                  <strong>{therapistData?.name || "there"}</strong>!
                </p>

                <div className={styles.statusBox}>
                  <div className={styles.statusItem}>
                    <CheckCircle className={styles.checkIcon} />
                    <span>Application Received</span>
                  </div>
                  <div className={styles.statusItem}>
                    <Clock className={styles.clockIcon} />
                    <span>Under Review</span>
                  </div>
                  <div className={styles.statusItem}>
                    <Mail className={styles.mailIcon} />
                    <span>You&apos;ll be notified via email</span>
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <h3 className={styles.infoTitle}>What happens next?</h3>
                  <ul className={styles.infoList}>
                    <li>Our team will review your credentials and qualifications</li>
                    <li>We&apos;ll verify your license and educational background</li>
                    <li>You&apos;ll receive an email notification once your application is reviewed</li>
                    <li>Typically, this process takes 2-5 business days</li>
                  </ul>
                </div>

                <div className={styles.actions}>
                  <Button
                    variant="healing"
                    size="lg"
                    onClick={handleCheckStatus}
                    className={styles.checkButton}
                  >
                    Check Status
                  </Button>
                  <Link href="/therapist-signin">
                    <Button variant="outline" size="lg" className={styles.signinButton}>
                      <ArrowLeft className={styles.buttonIcon} />
                      Back to Sign In
                    </Button>
                  </Link>
                </div>

                <p className={styles.footerText}>
                  Need help?{" "}
                  <Link href="/contact" className={styles.link}>
                    Contact our support team
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

