import type { Metadata } from "next";
import HeroSection from "./components/Landing/HeroSection";
import AboutUs from "./components/Landing/AboutUs";
// import TherapistGrid from "./components/Landing/TherapistGrid";
// import ChatInterface from "./components/Landing/ChatInterface";
import TherapistRecruitment from "./components/Landing/TherapistRecruitment";
import FaqSection from "./components/Landing/FaqSection";
import ContactUs from "./components/Landing/ContactUs";

export const metadata: Metadata = {
  title: "SALVIORIS - Your Safe Space for Mental Wellness",
  description: "SALVIORIS is a privacy-first mental wellness platform connecting patients with licensed therapists. Connect with therapists, manage your wellness journey, and track mental health metrics.",
  keywords: ["SALVIORIS", "mental health", "therapy", "counseling", "wellness", "privacy", "anonymous therapy", "online therapy", "mental wellness platform"],
  openGraph: {
    title: "SALVIORIS - Your Safe Space for Mental Wellness",
    description: "SALVIORIS is a privacy-first mental wellness platform connecting patients with licensed therapists.",
    type: "website",
  },
};

const Index = () => {
  return (
    <main className="min-h-screen m-0 p-0 w-full">
      <HeroSection />
      <AboutUs />
      {/* <TherapistGrid />
      <ChatInterface /> */}
      <TherapistRecruitment />
      <FaqSection />
      <ContactUs />
    </main>
  );
};

export default Index; 