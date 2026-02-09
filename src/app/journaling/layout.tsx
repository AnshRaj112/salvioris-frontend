import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Journaling | Salvioris",
  description:
    "Write, reflect, and revisit your private journal entries in Salvioris. A calm, secure space just for you.",
  openGraph: {
    title: "Private Journaling | Salvioris",
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


