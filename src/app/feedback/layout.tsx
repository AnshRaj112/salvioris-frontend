import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback - Help Us Improve",
  description: "Share your feedback about Salvioris. Your input helps us improve our platform and provide better mental wellness support to our community.",
  keywords: ["feedback", "suggestions", "improve", "mental health platform", "user feedback"],
  openGraph: {
    title: "Share Your Feedback | Salvioris",
    description: "Help us improve Salvioris by sharing your feedback and suggestions.",
    type: "website",
  },
};

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

