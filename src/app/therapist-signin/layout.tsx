import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Therapist Sign In - Professional Portal",
  description: "Sign in to your therapist account on Salvioris. Access your client sessions, manage your practice, and provide mental health support.",
  keywords: ["therapist login", "professional portal", "mental health professional", "therapy platform", "counselor login"],
  openGraph: {
    title: "Therapist Sign In | Salvioris",
    description: "Access your therapist account and manage your practice on Salvioris.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function TherapistSigninLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

