import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Salvioris Home | Vent or Journal Safely",
  description:
    "Choose between venting freely or private journaling in Salvioris, your safe space for emotional release and reflection.",
  openGraph: {
    title: "Salvioris Home | Vent or Journal Safely",
    description:
      "A calm starting point to either vent what you're feeling or reflect through journaling, always with your privacy in mind.",
    type: "website",
  },
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


