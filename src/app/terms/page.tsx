"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Terms.module.scss";

type ViewMode = "user" | "therapist";

export default function TermsPage() {
    const [mode, setMode] = useState<ViewMode>("user");

    return (
        <div className={`${styles.termsPage} ${mode === "user" ? styles.userMode : styles.therapistMode}`}>
            <div className={styles.navContainer}>
                <h1 className={styles.title}>Terms of Service</h1>

                <div className={styles.toggleContainer}>
                    <button
                        className={`${styles.toggleButton} ${mode === "user" ? styles.active : ""}`}
                        onClick={() => setMode("user")}
                    >
                        For Users
                    </button>
                    <button
                        className={`${styles.toggleButton} ${mode === "therapist" ? styles.active : ""}`}
                        onClick={() => setMode("therapist")}
                    >
                        For Therapists
                    </button>
                </div>
            </div>

            <div className={styles.contentContainer} key={mode}>
                {mode === "user" ? (
                    <div>
                        <h2>User Terms & Conditions</h2>

                        <h3>1. Creating an Account</h3>
                        <p>
                            By creating an account on Serenify, you agree to provide accurate, albeit limited,
                            information. You are responsible for safeguarding your password and any activities
                            under your account.
                        </p>

                        <h3>2. Acceptable Use</h3>
                        <p>
                            Serenify is a safe space. You agree not to use the platform for:
                        </p>
                        <ul>
                            <li>Harassment, bullying, or hate speech</li>
                            <li>Illegal activities or promotion of self-harm</li>
                            <li>Spamming or commercial solicitation</li>
                        </ul>
                        <p>Violation of these terms may result in account suspension.</p>

                        <h3>3. Disclaimer</h3>
                        <p>
                            Serenify is a support tool, not a replacement for emergency medical services.
                            If you or someone else is in immediate danger, please contact local emergency services.
                        </p>

                        <h3>4. Termination</h3>
                        <p>
                            We reserve the right to suspend or terminate your account if you violate these Terms
                            or if we are required to do so by law.
                        </p>
                    </div>
                ) : (
                    <div>
                        <h2>Therapist Service Agreement</h2>

                        <h3>1. Professional Licensing</h3>
                        <p>
                            You represent and warrant that you hold a valid, active license to practice mental health
                            counseling in your jurisdiction. You must notify us immediately of any changes to your
                            licensure status.
                        </p>

                        <h3>2. Ethical Standards</h3>
                        <p>
                            You agree to provide services in accordance with the ethical codes of your professional
                            licensing board (e.g., APA, ACA). This includes maintaining appropriate boundaries
                            and professional conduct.
                        </p>

                        <h3>3. Liability & Insurance</h3>
                        <p>
                            You are required to maintain valid professional liability insurance. You acknowledge that
                            you are an independent provider and not an employee of Serenify.
                        </p>

                        <h3>4. Compensation</h3>
                        <p>
                            Fees and payout schedules are detailed in the Therapist Compensation Addendum.
                            Payments are processed securely via our payment partner.
                        </p>
                    </div>
                )}
            </div>

            <div className={styles.footer}>
                <Link href="/" className={styles.backLink}>← Back to Home</Link>
            </div>
        </div>
    );
}
