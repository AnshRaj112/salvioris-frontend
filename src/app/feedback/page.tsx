import type { Metadata } from "next";
import { Suspense } from "react";
import FeedbackPageClient from "./FeedbackPageClient";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Share feedback with SALVIORIS. Your voice matters — help us make a more supportive space for everyone.",
};

export default function FeedbackPage() {
  return (
    <Suspense fallback={null}>
      <FeedbackPageClient />
    </Suspense>
  );
}
