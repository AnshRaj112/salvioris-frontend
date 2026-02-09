import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password - Create New Password",
  description: "Create a new password for your Salvioris account. Use the reset token from your email to set a secure new password.",
  keywords: ["reset password", "new password", "password change", "account security"],
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

