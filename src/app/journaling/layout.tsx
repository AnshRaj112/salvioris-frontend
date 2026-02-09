import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Journaling | SALVIORIS",
  description:
    "Write, reflect, and revisit your private journal entries in SALVIORIS. A calm, secure space just for you.",
  openGraph: {
    title: "Private Journaling | SALVIORIS",
    description:
      "Capture your thoughts and feelings in a secure journaling space where only you can see your entries.",
    type: "website",
  },
};

export default function JournalingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


