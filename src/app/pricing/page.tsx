import type { Metadata } from "next";
import InfoPage, { type InfoSection } from "@/components/InfoPage";

const UPDATED = "June 23, 2026";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Farpy public alpha pricing: wallet topups, per-frame render rates, and failed render refund policy.",
  alternates: { canonical: "/pricing" },
};

const SECTIONS: InfoSection[] = [
  {
    heading: "Current limits",
    items: [
      "Best for small render packages today.",
      "Great for quick Blender and Octane previews, tests, splash screens, and short frame ranges.",
      "Large projects should be tested with a small package first.",
    ],
  },
  {
    heading: "Per-frame rates",
    items: [
      "Standard: $0.01 per frame.",
      "Priority: $0.02 per frame where the priority queue is available.",
      "The quoted cost is frame_count multiplied by the selected rate.",
      "Example package: 8 Blender frames on Standard costs $0.08.",
      "Example package: 120 Blender frames on Standard costs $1.20.",
      "Test before sending larger work so the quote, output, and receipt match what you expect.",
    ],
  },
  {
    heading: "Wallet and topups",
    body: "Farpy uses wallet balance for render packages. Topup options are $10, $25, $50, and $100. No subscription is required.",
    card: true,
  },
  {
    heading: "Signup credit",
    body: "New accounts receive $0.25 free credit when the signup credit is available. It is wallet credit, not a separate free-frame system.",
    card: true,
  },
  {
    heading: "Failed renders",
    body: "Failed renders cost $0. If a wallet debit happens before a failed render, the debit should be refunded to the wallet according to the refund policy.",
    card: true,
  },
  {
    heading: "Receipts",
    body: "Completed packages include a delivery receipt with job, cost, payment mode, frame, and SHA-256 output hash details.",
    card: true,
  },
];

export default function PricingPage() {
  return (
    <InfoPage
      eyebrow="Pricing"
      title="Pricing"
      updated={UPDATED}
      lede="Farpy public alpha prices by finished frame and uses wallet balance for render packages. Start with a small package."
      sections={SECTIONS}
      toc={false}
    />
  );
}
