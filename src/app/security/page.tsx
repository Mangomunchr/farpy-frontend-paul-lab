import type { Metadata } from "next";
import InfoPage, { type InfoSection } from "@/components/InfoPage";

const UPDATED = "June 23, 2026";

export const metadata: Metadata = {
  title: "Security",
  description: "How to report Farpy security issues during public alpha.",
  alternates: { canonical: "/security" },
};

const SECTIONS: InfoSection[] = [
  {
    heading: "Report security issues",
    body: "Email security@farpy.com with a clear summary, affected URL or endpoint, reproduction steps, and impact. Do not include secrets in screenshots or public posts.",
  },
  {
    heading: "Do not attack production",
    body: "Do not run destructive tests, denial-of-service tests, credential attacks, social engineering, spam, or tests against other users' files or accounts.",
  },
  {
    heading: "Bounty policy",
    body: "Farpy does not offer a public bug bounty unless a written bounty program is explicitly published.",
  },
  {
    heading: "Response",
    body: "We review reports based on risk and public-alpha impact. Include a contact email so we can ask follow-up questions.",
  },
];

export default function SecurityPage() {
  return (
    <InfoPage
      eyebrow="Trust"
      title="Security"
      updated={UPDATED}
      lede="Security reporting rules for the public alpha."
      sections={SECTIONS}
    />
  );
}
