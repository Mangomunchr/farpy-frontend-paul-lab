import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

const UPDATED = "June 22, 2026";
const title = "Terms of service";
const description =
  "Farpy terms covering uploads, prohibited content, payments, refunds, and service availability.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/terms" },
};

type Section = { id: string; heading: string; body: React.ReactNode };

const SECTIONS: Section[] = [
  {
    id: "service",
    heading: "Beta service provided as-is",
    body: (
      <p>
        Farpy is a public beta render service. We provide render processing tools and related
        download and receipt services as-is. Render jobs may fail, and we do not guarantee
        that every upload will render successfully.
      </p>
    ),
  },
  {
    id: "ownership",
    heading: "You own your uploads",
    body: (
      <p>
        You keep ownership of the files you upload and the frames produced from those files.
        You give Farpy permission to store, process, render, and return those files only as
        needed to provide the service.
      </p>
    ),
  },
  {
    id: "prohibited-content",
    heading: "Prohibited content",
    body: (
      <ul>
        <li>Do not upload illegal content.</li>
        <li>Do not upload exploitative content or content involving minors.</li>
        <li>Do not upload malware, stolen data, or files intended to attack the service.</li>
        <li>Do not use Farpy to violate another person&apos;s rights.</li>
      </ul>
    ),
  },
  {
    id: "payments",
    heading: "Payment and refund policy",
    body: (
      <p>
        Render prices are shown before checkout. Payment is handled by Stripe. Failed renders
        should not finalize a charge without a receipt for completed output. If a payment or
        render result looks wrong, contact us so we can review the job and correct the charge
        where appropriate.
      </p>
    ),
  },
  {
    id: "file-retention",
    heading: "Temporary file retention",
    body: (
      <p>
        Farpy retains uploaded files and rendered outputs according to operational
        policies for rendering, delivery, support, storage management, abuse
        prevention, or maintenance.
      </p>
    ),
  },
  {
    id: "availability",
    heading: "No uptime guarantee in alpha",
    body: (
      <p>
        Farpy may be unavailable during maintenance, capacity limits, infrastructure problems,
        or abuse prevention. We may reject uploads, pause work, or fail jobs when needed to
        protect the service.
      </p>
    ),
  },
  {
    id: "contact",
    heading: "Contact",
    body: (
      <p>
        Questions about these terms? Email <a href="mailto:support@farpy.com">support@farpy.com</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <>
      <SiteNav />
      <main className="legal">
        <div className="wrap">
          <div className="legal-inner">
            <header className="legal-head">
              <p className="legal-eyebrow">Legal</p>
              <h1 className="legal-title">Terms of service</h1>
              <p className="legal-updated">Last updated {UPDATED}</p>
              <p className="legal-lede">
                These terms cover the basic rules for using Farpy to upload files, pay for
                renders, and download finished output.
              </p>
            </header>

            <nav className="legal-toc" aria-label="On this page">
              {SECTIONS.map((section) => (
                <a key={section.id} href={`#${section.id}`}>
                  {section.heading}
                </a>
              ))}
            </nav>

            <div className="legal-body">
              {SECTIONS.map((section) => (
                <section key={section.id} id={section.id} className="legal-section">
                  <h2>{section.heading}</h2>
                  {section.body}
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
