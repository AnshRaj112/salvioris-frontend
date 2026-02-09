import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - Start Your Wellness Journey",
  description: "Create your SALVIORIS account and begin your journey to mental wellness. Privacy-first, secure, and anonymous. Connect with licensed therapists today.",
  keywords: ["sign up", "register", "create account", "mental health", "therapy", "wellness", "privacy"],
  openGraph: {
    title: "Sign Up for SALVIORIS - Start Your Wellness Journey",
    description: "Create your account and begin your journey to mental wellness with privacy-first therapy.",
    type: "website",
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

