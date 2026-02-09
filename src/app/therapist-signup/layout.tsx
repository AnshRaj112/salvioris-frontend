import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Therapist Registration - Join Our Platform",
  description: "Apply to become a licensed therapist on Salvioris. Help people on their mental wellness journey while building your practice. Submit your credentials and join our community of mental health professionals.",
  keywords: ["therapist registration", "become a therapist", "mental health professional", "therapy platform", "counselor application", "licensed therapist"],
  openGraph: {
    title: "Become a Therapist on Salvioris",
    description: "Apply to join Salvioris as a licensed therapist and help people on their mental wellness journey.",
    type: "website",
  },
};

export default function TherapistSignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

