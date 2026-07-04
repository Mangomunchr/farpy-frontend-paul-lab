import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

const UPDATED = "June 22, 2026";
const title = "Privacy policy";
const description =
  "How Farpy public beta handles uploaded files, render outputs, account email, receipts, logs, and Stripe payments.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  {
    heading: "The short version",
    body: "Farpy public beta processes uploaded files to quote and run renders, returns output and receipts through token-gated links, and keeps account email only when you sign in for balance or history. Render files are retained according to Farpy operational policies.",
  },
  {
    heading: "What we collect",
    body: "Uploaded .blend or .orbx files, generated render outputs, receipt metadata, job status records, account email for signed-in users, payment records from Stripe, Google Analytics 4 page-view analytics, optional Farpy Firehose/custom page-view telemetry when configured, and basic technical logs needed to operate the service.",
  },
  {
    heading: "How we use it",
    body: "We use uploads to create jobs, run renders, produce output, generate receipts, process payment, prevent abuse, understand page traffic, and debug service issues.",
  },
  {
    heading: "Files",
    body: "Download and receipt access is controlled by per-job tokens. Uploaded files and rendered outputs are never sold and never used to train AI.",
  },
  {
    heading: "Payments",
    body: "Payment is handled by Stripe. Farpy does not store full card numbers. Receipts record the job, output hash, amount, and payment status.",
  },
  {
    heading: "Retention",
    body: "Uploads and outputs are retained only as needed for rendering, download, support, and abuse prevention. Receipts and payment records may be retained where required for financial or legal reasons. Page-view analytics use sanitized URLs and do not intentionally include render, download, or receipt tokens. Technical logs may include IP address, user agent, timestamps, request paths, and operational events.",
  },
  {
    heading: "Contact",
    body: "Questions about privacy or data handling can be sent to privacy@farpy.com.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SiteNav />
      <main className="legal">
        <div className="wrap">
          <div className="legal-inner">
            <header className="legal-head">
              <p className="legal-eyebrow">Legal</p>
              <h1 className="legal-title">Privacy policy</h1>
              <p className="legal-updated">Last updated {UPDATED}</p>
              <p className="legal-lede">
                Farpy stores the minimum data needed to quote, render, deliver output,
                process payment, and support signed-in wallet accounts.
              </p>
            </header>

            <div className="legal-body">
              {SECTIONS.map((section) => (
                <section key={section.heading} className="legal-section">
                  <h2>{section.heading}</h2>
                  <p>{section.body}</p>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
