import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Farpy support for render, receipt, wallet, or payment help.",
  alternates: { canonical: "/contact" },
};

const DETAILS = ["job_id", "receipt_id", "account email", "payment intent if available"];

export default function ContactPage() {
  return (
    <>
      <SiteNav />
      <main className="legal">
        <div className="wrap">
          <div className="legal-inner">
            <header className="legal-head">
              <p className="legal-eyebrow">Support</p>
              <h1 className="legal-title">Contact</h1>
              <p className="legal-lede">
                Email <a href="mailto:support@farpy.com">support@farpy.com</a> for render,
                receipt, wallet, or payment help. We reply within 1 business day.
              </p>
            </header>

            <section className="legal-section">
              <h2>What to include</h2>
              <ul>
                {DETAILS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
