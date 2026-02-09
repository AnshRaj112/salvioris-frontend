import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Username - Recover Your Account",
  description: "Recover your Salvioris username. Enter your recovery email to receive your username reminder.",
  keywords: ["forgot username", "username recovery", "account recovery", "recover username"],
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotUsernameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

