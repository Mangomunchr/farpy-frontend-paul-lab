import type { Metadata } from "next";
import InfoPage, { type InfoSection } from "@/components/InfoPage";

const UPDATED = "June 23, 2026";

export const metadata: Metadata = {
  title: "Docs",
  description: "Minimal Farpy public alpha docs for getting started, wallet topups, uploads, frames, downloads, receipts, and API use.",
  alternates: { canonical: "/docs" },
};

const SECTIONS: InfoSection[] = [
  {
    heading: "Getting started",
    body: "Sign in with email if you want stored balance and package history, then upload a .blend or .orbx file from the homepage. Farpy shows price before a render starts. Start with a small package.",
  },
  {
    heading: "Current operating stage",
    items: [
      "Farpy is early access production alpha.",
      "Best for small render packages today: previews, tests, splash screens, and short frame ranges.",
      "Large projects should be tested with a small package first.",
      "NodeMuncher is controlled alpha, not a broad public worker launch.",
      "Bitcoin Lightning is hidden unless explicitly enabled after routing proof.",
      "Card and Bitcoin topups are the active public payment paths; PayPal is deferred.",
      "Farpy Benchmark is separate and held for final-phase validation; it is not required for render packages.",
    ],
  },
  {
    heading: "Simple terms",
    items: [
      "A package is your uploaded render file and frame settings.",
      "A render partner is the machine that completes the render.",
      "A delivery receipt proves what happened and keeps technical IDs, frame counts, and SHA-256 output proof.",
    ],
  },
  {
    heading: "Wallet and topups",
    body: "Wallet topups fund small render packages without a separate checkout for each job. Card and Bitcoin topups currently support $10, $25, $50, and $100.",
  },
  {
    heading: "Uploading files",
    body: "Upload .blend files for Blender or .orbx files for Octane through the homepage. Blender supports frame counts for stills and animations; Octane public alpha supports still renders only.",
  },
  {
    heading: "Frame ranges",
    body: "For Blender, the frame count you enter is the number of frames priced and rendered. A still image is 1 frame. Five seconds at 24 fps is 120 frames. Octane public alpha is locked to 1 frame.",
  },
  {
    heading: "Downloads and receipts",
    body: "Completed packages produce a ZIP download and a delivery receipt. Links are token-gated from the package tracker and account history.",
  },
  {
    heading: "Render history",
    body: "Signed-in users can view recent packages from the account page, including completed download and receipt links when available.",
  },
  {
    heading: "Blender support",
    body: "Blender .blend rendering supports stills and multi-frame jobs. For production alpha, test short jobs before sending larger work. Output is packaged into a ZIP with rendered frame files and receipt metadata.",
  },
  {
    heading: "Octane support",
    body: "Octane .orbx rendering is visible in public alpha for still renders only. The Octane frame count is locked to 1 and the output is delivered as a ZIP with a receipt.",
  },
  {
    heading: "API quickstart",
    body: "Use the API page for the current public beta endpoints. It lists only live web-render, wallet, and account-history routes.",
  },
  {
    heading: "Troubleshooting",
    body: "For support, include your job_id, receipt_id, account email, payment intent if available, and a short description of what failed.",
  },
];

export default function DocsPage() {
  return (
    <InfoPage
      eyebrow="Docs"
      title="Farpy docs"
      updated={UPDATED}
      lede="Minimal operating notes for the public alpha."
      sections={SECTIONS}
    />
  );
}
