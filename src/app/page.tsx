// import type { Metadata } from "next";
// import HeroSection from "./components/Landing/HeroSection";
// import AboutUs from "./components/Landing/AboutUs";
// import TherapistGrid from "./components/Landing/TherapistGrid";
// import ChatInterface from "./components/Landing/ChatInterface";
// import TherapistRecruitment from "./components/Landing/TherapistRecruitment";
// import FaqSection from "./components/Landing/FaqSection";
// import ContactUs from "./components/Landing/ContactUs";

// export const metadata: Metadata = {
//   title: "Home - Your Safe Space for Mental Wellness",
//   description: "Welcome to SALVIORIS - a privacy-first mental wellness platform. Connect with licensed therapists, express yourself freely, and find support in a safe, judgment-free environment.",
//   keywords: ["mental health", "therapy", "counseling", "wellness", "privacy", "anonymous therapy", "online therapy", "mental wellness platform"],
//   openGraph: {
//     title: "SALVIORIS - Your Safe Space for Mental Wellness",
//     description: "Privacy-first mental wellness platform connecting users with licensed therapists.",
//     type: "website",
//   },
// };
"use client";
import { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { api, ApiError } from "./lib/api";
import styles from "./page.module.scss";

export default function HomePage() {
  const [activeForm, setActiveForm] = useState<"user" | "therapist">("user");
  
  // User waitlist form state
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  // Therapist waitlist form state
  const [therapistName, setTherapistName] = useState("");
  const [therapistEmail, setTherapistEmail] = useState("");
  const [therapistPhone, setTherapistPhone] = useState("");
  const [isSubmittingTherapist, setIsSubmittingTherapist] = useState(false);
  const [therapistMessage, setTherapistMessage] = useState<string | null>(null);
  const [therapistError, setTherapistError] = useState<string | null>(null);

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      setUserError("Name and email are required");
      return;
    }

    setIsSubmittingUser(true);
    setUserError(null);
    setUserMessage(null);

    try {
      const response = await api.submitUserWaitlist({
        name: userName.trim(),
        email: userEmail.trim(),
      });

      if (response.success) {
        setUserMessage(response.message);
        setUserName("");
        setUserEmail("");
      }
    } catch (err) {
      const apiError = err as ApiError;
      setUserError(apiError.message || "Failed to join waitlist. Please try again.");
    } finally {
      setIsSubmittingUser(false);
    }
  };

// const Index = () => {
  const handleTherapistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!therapistName.trim() || !therapistEmail.trim()) {
      setTherapistError("Name and email are required");
      return;
    }

    setIsSubmittingTherapist(true);
    setTherapistError(null);
    setTherapistMessage(null);

    try {
      const response = await api.submitTherapistWaitlist({
        name: therapistName.trim(),
        email: therapistEmail.trim(),
        phone: therapistPhone.trim() || undefined,
      });

      if (response.success) {
        setTherapistMessage(response.message);
        setTherapistName("");
        setTherapistEmail("");
        setTherapistPhone("");
      }
    } catch (err) {
      const apiError = err as ApiError;
      setTherapistError(apiError.message || "Failed to join waitlist. Please try again.");
    } finally {
      setIsSubmittingTherapist(false);
    }
  };
  return (
//      <main className="min-h-screen m-0 p-0 w-full">
//       <HeroSection />
//       <AboutUs />
//       {/* <TherapistGrid />
//       <ChatInterface /> */}
//       <TherapistRecruitment />
//       <FaqSection />
//       <ContactUs />
// };

// export default Index;

    <main className={`${styles.waitlistPage} ${activeForm === "user" ? styles.userTheme : styles.therapistTheme}`}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Join the Waitlist</h1>
          <p className={styles.subtitle}>
            Be among the first to experience SALVIORIS when we launch. Choose your role below.
          </p>
        </div>

        <div className={styles.formTabs}>
          <button
            className={`${styles.tab} ${activeForm === "user" ? styles.active : ""}`}
            onClick={() => {
              setActiveForm("user");
              setUserError(null);
              setUserMessage(null);
            }}
          >
            Join as User
          </button>
          <button
            className={`${styles.tab} ${activeForm === "therapist" ? styles.active : ""}`}
            onClick={() => {
              setActiveForm("therapist");
              setTherapistError(null);
              setTherapistMessage(null);
            }}
          >
            Join as Therapist
          </button>
        </div>

        <div className={styles.formContainer}>
          {activeForm === "user" ? (
            <form onSubmit={handleUserSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="user-name" className={styles.label}>
                  Name *
                </label>
                <Input
                  id="user-name"
                  type="text"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    setUserError(null);
                    setUserMessage(null);
                  }}
                  placeholder="Enter your name"
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="user-email" className={styles.label}>
                  Email *
                </label>
                <Input
                  id="user-email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => {
                    setUserEmail(e.target.value);
                    setUserError(null);
                    setUserMessage(null);
                  }}
                  placeholder="Enter your email"
                  required
                  className={styles.input}
                />
              </div>

              {userMessage && (
                <div className={styles.successMessage}>{userMessage}</div>
              )}
              {userError && (
                <div className={styles.errorMessage}>{userError}</div>
              )}

              <Button
                type="submit"
                variant="healing"
                disabled={isSubmittingUser}
                className={styles.submitButton}
              >
                {isSubmittingUser ? "Joining..." : "Join Waitlist"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleTherapistSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="therapist-name" className={styles.label}>
                  Name *
                </label>
                <Input
                  id="therapist-name"
                  type="text"
                  value={therapistName}
                  onChange={(e) => {
                    setTherapistName(e.target.value);
                    setTherapistError(null);
                    setTherapistMessage(null);
                  }}
                  placeholder="Enter your name"
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="therapist-email" className={styles.label}>
                  Email *
                </label>
                <Input
                  id="therapist-email"
                  type="email"
                  value={therapistEmail}
                  onChange={(e) => {
                    setTherapistEmail(e.target.value);
                    setTherapistError(null);
                    setTherapistMessage(null);
                  }}
                  placeholder="Enter your email"
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="therapist-phone" className={styles.label}>
                  Phone (Optional)
                </label>
                <Input
                  id="therapist-phone"
                  type="tel"
                  value={therapistPhone}
                  onChange={(e) => {
                    setTherapistPhone(e.target.value);
                    setTherapistError(null);
                    setTherapistMessage(null);
                  }}
                  placeholder="Enter your phone number"
                  className={styles.input}
                />
              </div>

              {therapistMessage && (
                <div className={styles.successMessage}>{therapistMessage}</div>
              )}
              {therapistError && (
                <div className={styles.errorMessage}>{therapistError}</div>
              )}

              <Button
                type="submit"
                variant="healing"
                disabled={isSubmittingTherapist}
                className={styles.submitButton}
              >
                {isSubmittingTherapist ? "Joining..." : "Join Waitlist"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
// };

// export default Index;
}
