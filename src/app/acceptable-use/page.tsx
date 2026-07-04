import type { Metadata } from "next";
import InfoPage, { type InfoSection } from "@/components/InfoPage";

const UPDATED = "June 23, 2026";

export const metadata: Metadata = {
  title: "Acceptable use",
  description: "Farpy acceptable use rules for public alpha uploads and render jobs.",
  alternates: { canonical: "/acceptable-use" },
};

const SECTIONS: InfoSection[] = [
  {
    heading: "Disallowed content and behavior",
    items: [
      "Illegal content or activity.",
      "Malware, exploit payloads, or attempts to abuse infrastructure.",
      "Credential theft, phishing, stolen data, or impersonation.",
      "Non-consensual sexual content.",
      "Child sexual abuse material or any sexual content involving minors.",
      "Extremist or terrorist material.",
      "Copyright abuse or uploads you do not have the right to render.",
      "Attempts to bypass limits, attack production, or interfere with other users.",
    ],
  },
  {
    heading: "Private and client work",
    body: "Private client work is allowed when you have the rights and permission to render it and it follows this policy.",
  },
  {
    heading: "Enforcement",
    body: "Farpy may reject uploads, fail jobs, remove files, suspend access, or preserve records when needed for safety, legal compliance, or abuse prevention.",
  },
];

export default function AcceptableUsePage() {
  return (
    <InfoPage
      eyebrow="Trust"
      title="Acceptable use"
      updated={UPDATED}
      lede="The public alpha is for legitimate rendering work."
      sections={SECTIONS}
    />
  );
}
