import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import { Footer } from "./components/Footer/footer";
import { SiteLock } from "./components/SiteLock";

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
    default: "SALVIORIS - Your Safe Space for Mental Wellness",
    template: "%s | SALVIORIS"
  },
  description: "SALVIORIS is a privacy-first mental wellness platform connecting users with licensed therapists. Express yourself freely in a safe, judgment-free environment.",
  keywords: ["mental health", "therapy", "counseling", "wellness", "privacy", "anonymous therapy", "online therapy"],
  authors: [{ name: "SALVIORIS" }],
  creator: "SALVIORIS",
  publisher: "SALVIORIS",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SALVIORIS",
    title: "SALVIORIS - Your Safe Space for Mental Wellness",
    description: "Privacy-first mental wellness platform connecting users with licensed therapists.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SALVIORIS - Your Safe Space for Mental Wellness",
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
        <SiteLock>
          {children}
        </SiteLock>
        {/* <Footer /> */}
      </body>
    </html>
  );
}
