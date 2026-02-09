import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vent - Express Yourself Freely",
  description: "Your safe space to vent and express yourself without judgment. Share your thoughts, feelings, and experiences in complete privacy on Salvioris.",
  keywords: ["vent", "express yourself", "safe space", "mental health", "privacy", "anonymous venting", "emotional support"],
  openGraph: {
    title: "Vent - Express Yourself Freely | Salvioris",
    description: "Your safe space to vent and express yourself without judgment.",
    type: "website",
  },
  robots: {
    index: false, // Private venting space, don't index
    follow: false,
  },
};

export default function VentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

