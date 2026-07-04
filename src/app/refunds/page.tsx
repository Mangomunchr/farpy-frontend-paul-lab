import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

const UPDATED = "June 22, 2026";

export const metadata: Metadata = {
  title: "Refunds",
  description: "Farpy public beta refund and wallet credit policy.",
  alternates: { canonical: "/refunds" },
};

const SECTIONS = [
  {
    heading: "Failed renders",
    body: "Failed renders cost $0. If a wallet-funded render fails after debit, the debit should be refunded to your wallet balance.",
  },
  {
    heading: "Duplicate charges",
    body: "If you see a duplicate card charge, duplicate wallet credit, or incorrect debit, contact support and include the payment or job details so we can review it.",
  },
  {
    heading: "Wallet credit",
    body: "Wallet credits are intended for Farpy render jobs. Public beta refund handling is reviewed case by case when a payment, render, or receipt is wrong.",
  },
  {
    heading: "Contact",
    body: "Email support@farpy.com with your job_id, receipt_id, account email, and payment intent if available.",
  },
];

export default function RefundsPage() {
  return (
    <>
      <SiteNav />
      <main className="legal">
        <div className="wrap">
          <div className="legal-inner">
            <header className="legal-head">
              <p className="legal-eyebrow">Trust</p>
              <h1 className="legal-title">Refunds</h1>
              <p className="legal-updated">Last updated {UPDATED}</p>
              <p className="legal-lede">
                Farpy public beta is designed so you pay for successful rendered frames,
                not failed render attempts.
              </p>
            </header>
            <div className="legal-body">
              {SECTIONS.map((section) => (
                <section className="legal-section" key={section.heading}>
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
