import type { Metadata } from "next";
import { Suspense } from "react";
import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact SALVIORIS support — for users and therapists.",
};

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactPageClient />
    </Suspense>
  );
}
