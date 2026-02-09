import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - Welcome Back",
  description: "Sign in to your SALVIORIS account to reconnect with your therapist and continue your journey to wellness. Secure, private, and confidential.",
  keywords: ["sign in", "login", "mental health", "therapy", "wellness", "account access"],
  openGraph: {
    title: "Sign In to SALVIORIS",
    description: "Sign in to your SALVIORIS account to continue your wellness journey.",
    type: "website",
  },
  robots: {
    index: false, // Login pages typically not indexed
    follow: false,
  },
};

export default function SigninLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

