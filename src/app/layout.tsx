import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "./components/Footer/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Salvioris - Your Safe Space for Mental Wellness",
    template: "%s | Salvioris"
  },
  description: "Salvioris is a privacy-first mental wellness platform connecting users with licensed therapists. Express yourself freely in a safe, judgment-free environment.",
  keywords: ["mental health", "therapy", "counseling", "wellness", "privacy", "anonymous therapy", "online therapy"],
  authors: [{ name: "Salvioris" }],
  creator: "Salvioris",
  publisher: "Salvioris",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Salvioris",
    title: "Salvioris - Your Safe Space for Mental Wellness",
    description: "Privacy-first mental wellness platform connecting users with licensed therapists.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Salvioris - Your Safe Space for Mental Wellness",
    description: "Privacy-first mental wellness platform connecting users with licensed therapists.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <Footer />
      </body>
    </html>
  );
}
