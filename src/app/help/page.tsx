import type { Metadata } from "next";
import { SupportSections } from "../components/SupportSections/SupportSections";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Get help using SALVIORIS — for users and therapists.",
};

export default function HelpCenterPage() {
  return (
    <SupportSections
      pageTitle="Help Center"
      userTitle="Help Center"
      userContent={
        <>
          <p className="mb-4">
            Find answers and get support for your SALVIORIS experience.
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-4">
            <li>
              <Link href="/faq">FAQ</Link> — Common questions about account, sessions, and privacy.
            </li>
            <li>
              <Link href="/contact">Contact us</Link> — Reach our support team by email or form.
            </li>
            <li>
              <Link href="/feedback">Feedback</Link> — Share suggestions to help us improve.
            </li>
          </ul>
          <p>
            For crisis support, call <strong>14416</strong> or emergency <strong>108</strong>.
          </p>
        </>
      }
      therapistTitle="Therapist help & resources"
      therapistContent={
        <>
          <p className="mb-4">
            Resources and support for therapists on the SALVIORIS platform.
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-4">
            <li>
              <Link href="/faq">FAQ</Link> — Joining the network, verification, and scheduling.
            </li>
            <li>
              <Link href="/contact">Contact us</Link> — Partner and technical support.
            </li>
            <li>
              <Link href="/therapist-signup">Join our network</Link> — Apply to become a therapist.
            </li>
          </ul>
          <p>
            For urgent partner issues, use the contact form and we&apos;ll respond as soon as possible.
          </p>
        </>
      }
    />
  );
}
