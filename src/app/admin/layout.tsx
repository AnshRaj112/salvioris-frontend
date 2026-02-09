import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Administrative dashboard for managing therapists, users, and platform settings on SALVIORIS.",
  robots: {
    index: false, // Admin pages should not be indexed
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

