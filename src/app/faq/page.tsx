import type { Metadata } from "next";
import { SupportSections } from "../components/SupportSections/SupportSections";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about SALVIORIS — for users and therapists.",
};

export default function FAQPage() {
  return (
    <SupportSections
      pageTitle="FAQ"
      userTitle="Frequently asked questions"
      userContent={
        <>
          <div className="space-y-4">
            <div>
              <strong>How do I create an account?</strong>
              <p className="mt-1">
                Go to <Link href="/signup">Sign up</Link>, enter your details, and follow the steps. Your data is kept private and secure.
              </p>
            </div>
            <div>
              <strong>Is my information private?</strong>
              <p className="mt-1">
                Yes. We are committed to privacy. Sessions and personal information are handled in line with our <Link href="/privacy">Privacy Policy</Link>.
              </p>
            </div>
            <div>
              <strong>How do I find a therapist?</strong>
              <p className="mt-1">
                After signing in, you can explore the platform and connect with licensed professionals. Use the tools available in your dashboard.
              </p>
            </div>
            <div>
              <strong>What if I need help right now?</strong>
              <p className="mt-1">
                If you&apos;re in crisis, call <strong>14416</strong> or emergency <strong>108</strong>. For non-urgent support, see <Link href="/help">Help Center</Link> or <Link href="/contact">Contact us</Link>.
              </p>
            </div>
          </div>
        </>
      }
      therapistTitle="FAQ for therapists"
      therapistContent={
        <>
          <div className="space-y-4">
            <div>
              <strong>How do I join the network?</strong>
              <p className="mt-1">
                Complete the application at <Link href="/therapist-signup">Join our network</Link>. You&apos;ll need your license details, education, and relevant documents. We review each application before approval.
              </p>
            </div>
            <div>
              <strong>How long does verification take?</strong>
              <p className="mt-1">
                We aim to review applications within a few business days. You&apos;ll receive an email once your account is approved or if we need more information.
              </p>
            </div>
            <div>
              <strong>What documents do I need?</strong>
              <p className="mt-1">
                Typically a valid license/certificate and degree proof. Exact requirements are listed on the <Link href="/therapist-signup">therapist signup</Link> page.
              </p>
            </div>
            <div>
              <strong>Who do I contact for partner support?</strong>
              <p className="mt-1">
                Email <a href="mailto:support@salvioris.com">support@salvioris.com</a> with &quot;Therapist support&quot; in the subject, or use <Link href="/contact">Contact us</Link>.
              </p>
            </div>
          </div>
        </>
      }
    />
  );
}
