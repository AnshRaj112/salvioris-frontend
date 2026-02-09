import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Application Under Review",
  description: "Your therapist application is being reviewed by the Salvioris team. We'll notify you once your application has been processed.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TherapistPendingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

