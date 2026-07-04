import type { Metadata } from "next";
import InfoPage from "@/components/InfoPage";
import { FAQS } from "@/components/FaqSection";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Farpy public alpha questions about accounts, pricing, files, refunds, privacy, and renderer support.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <InfoPage
      eyebrow="Help"
      title="FAQ"
      lede="Short answers for the public alpha render flow."
      sections={FAQS.map((faq) => ({
        heading: faq.q,
        body: faq.a,
      }))}
    />
  );
}
