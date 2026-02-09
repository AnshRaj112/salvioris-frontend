import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
const faqs = [
    {
      question: "How do I know if my therapist is qualified?",
      answer: "All therapists on Mental Health App are licensed mental health professionals who have passed rigorous background checks and credential verification. You can view their credentials, specializations, and patient reviews on their profiles.",
    },
    {
      question: "Is my information private and secure?",
      answer: "Yes, we take your privacy seriously. Mental Health App is HIPAA compliant and uses end-to-end encryption for all communications. Your personal information and conversations are completely confidential.",
    },
    {
      question: "What if I&apos;m in a crisis situation?",
      answer: "If you&apos;re experiencing a mental health crisis, please call 14416 (Suicide & Crisis Lifeline) or 108 immediately. Mental Health App is designed for ongoing therapy support, not emergency crisis intervention.",
    },
    {
      question: "How much does therapy cost?",
      answer: "Therapy sessions range from $80-200 per session depending on the therapist&apos;s experience and specialization. Many therapists offer sliding scale pricing, and we accept most major insurance plans.",
    },
    {
      question: "Can I switch therapists if needed?",
      answer: "Absolutely. Finding the right therapeutic fit is important for your healing journey. You can switch therapists at any time through your dashboard at no additional cost.",
    },
  ];
export default function FaqSection() {
    return (
<section className="py-20 bg-[#1d2935] w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              We&apos;re here to address your concerns and help you feel comfortable
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-card/50 backdrop-blur-sm border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-display font-medium hover:text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    )
}
