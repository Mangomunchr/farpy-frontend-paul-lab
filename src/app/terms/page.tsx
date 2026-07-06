import type { Metadata } from "next";
import TermsPrivacyPage from "@/components/TermsPrivacyPage";

const title = "Terms & Privacy";
const description =
  "Farpy terms covering uploads, prohibited content, payments, and refunds, plus how uploaded files, render outputs, receipts, and payments are handled.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/terms" },
};

export default function TermsRoute() {
  return <TermsPrivacyPage />;
}
