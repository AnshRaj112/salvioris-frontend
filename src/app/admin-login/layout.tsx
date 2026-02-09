import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login | SALVIORIS",
  description: "Admin login page for SALVIORIS administrative dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

