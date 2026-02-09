import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password - Reset Your Account",
  description: "Reset your Salvioris account password. Enter your recovery email to receive password reset instructions.",
  keywords: ["forgot password", "password reset", "account recovery", "reset password"],
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

