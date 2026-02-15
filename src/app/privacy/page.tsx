"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Privacy.module.scss";

type ViewMode = "user" | "therapist";

export default function PrivacyPage() {
    const [mode, setMode] = useState<ViewMode>("user");

    return (
        <div className={`${styles.privacyPage} ${mode === "user" ? styles.userMode : styles.therapistMode}`}>
            <div className={styles.navContainer}>
                <h1 className={styles.title}>Privacy Policy</h1>

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

            <div className={styles.contentContainer} key={mode}> {/* Key forces re-render for animation */}
                {mode === "user" ? (
                    <div>
                        <h2>User Privacy & Data Protection</h2>

                        <h3>1. Anonymity First</h3>
                        <p>
                            Your identity is protected by design. We do not require your real legal name for sign-up,
                            and we employ strict data minimization practices. Your journaling is for your eyes only.
                        </p>

                        <h3>2. Encrypted Communications</h3>
                        <p>
                            All interactions between you and our AI or licensed therapists are encrypted in transit and at rest.
                            User data is stored securely using industry-standard encryption protocols.
                        </p>

                        <h3>3. Data Usage & Collection</h3>
                        <p>We collect the following limited information:</p>
                        <ul>
                            <li>Account credentials (hashed and salted)</li>
                            <li>Journal entries (encrypted user content)</li>
                            <li>Session metadata (timestamps, duration)</li>
                        </ul>
                        <p>
                            We do <strong>not</strong> sell your personal data to third parties or advertisers.
                        </p>

                        <h3>4. Your Rights</h3>
                        <p>
                            You maintain full ownership of your data. You may request a full export of your history
                            or complete account deletion at any time via your settings panel.
                        </p>
                    </div>
                ) : (
                    <div>
                        <h2>Therapist Professional Privacy</h2>

                        <h3>1. Professional Verification</h3>
                        <p>
                            To maintain the integrity of our platform, we collect verification documents including
                            license numbers, educational history, and professional identification. This data is
                            processed securely and accessible only to our compliance team.
                        </p>

                        <h3>2. Client Confidentiality (HIPAA)</h3>
                        <p>
                            Therapists are required to adhere to HIPAA regulations and ethical guidelines regarding
                            patient confidentiality. Our platform provides the technical safeguards (encryption, access controls)
                            to support your compliance.
                        </p>

                        <h3>3. Session Records</h3>
                        <p>
                            Session notes and chat logs are stored securely. As a provider, you are the data controller
                            for your clinical notes, while we act as the data processor ensuring their security.
                        </p>

                        <h3>4. Profile Visibility</h3>
                        <p>
                            Your professional profile (name, specialization, bio) is public to users on the platform
                            to facilitate matching. You have control over your availability status and profile details.
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
