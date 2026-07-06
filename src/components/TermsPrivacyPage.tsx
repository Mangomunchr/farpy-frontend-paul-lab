import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const LEGAL_UPDATED = "June 22, 2026";

type Section = { id: string; heading: string; body: React.ReactNode };

const TERMS_SECTIONS: Section[] = [
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
    heading: "No uptime guarantee in beta",
    body: (
      <p>
        Farpy may be unavailable during maintenance, capacity limits, infrastructure problems,
        or abuse prevention. We may reject uploads, pause work, or fail jobs when needed to
        protect the service.
      </p>
    ),
  },
];

const PRIVACY_SECTIONS: Section[] = [
  {
    id: "privacy-summary",
    heading: "The short version",
    body: (
      <p>
        Farpy public beta processes uploaded files to quote and run renders, returns output and
        receipts through token-gated links, and keeps account email only when you sign in for
        balance or history. Render files are retained according to Farpy operational policies.
      </p>
    ),
  },
  {
    id: "collection",
    heading: "What we collect",
    body: (
      <p>
        Uploaded .blend or .orbx files, generated render outputs, receipt metadata, job status
        records, account email for signed-in users, payment records from Stripe, Google
        Analytics 4 page-view analytics, optional Farpy Firehose/custom page-view telemetry
        when configured, and basic technical logs needed to operate the service.
      </p>
    ),
  },
  {
    id: "use",
    heading: "How we use it",
    body: (
      <p>
        We use uploads to create jobs, run renders, produce output, generate receipts, process
        payment, prevent abuse, understand page traffic, and debug service issues.
      </p>
    ),
  },
  {
    id: "files",
    heading: "Files",
    body: (
      <p>
        Download and receipt access is controlled by per-job tokens. Uploaded files and
        rendered outputs are never sold and never used to train AI.
      </p>
    ),
  },
  {
    id: "privacy-payments",
    heading: "Payments",
    body: (
      <p>
        Payment is handled by Stripe. Farpy does not store full card numbers. Receipts record
        the job, output hash, amount, and payment status.
      </p>
    ),
  },
  {
    id: "retention",
    heading: "Retention",
    body: (
      <p>
        Uploads and outputs are retained only as needed for rendering, download, support, and
        abuse prevention. Receipts and payment records may be retained where required for
        financial or legal reasons. Page-view analytics use sanitized URLs and do not
        intentionally include render, download, or receipt tokens. Technical logs may include
        IP address, user agent, timestamps, request paths, and operational events.
      </p>
    ),
  },
];

const PARTS = [
  {
    id: "terms",
    label: "Part 1",
    title: "Terms of service",
    lede: "The basic rules for using Farpy to upload files, pay for renders, and download finished output.",
    sections: TERMS_SECTIONS,
  },
  {
    id: "privacy",
    label: "Part 2",
    title: "Privacy policy",
    lede: "The minimum data Farpy stores to quote, render, deliver output, process payment, and support signed-in wallet accounts.",
    sections: PRIVACY_SECTIONS,
  },
];

export default function TermsPrivacyPage() {
  return (
    <>
      <SiteNav />
      <main className="legal">
        <div className="wrap">
          <div className="legal-inner">
            <header className="legal-head">
              <p className="legal-eyebrow">Legal</p>
              <h1 className="legal-title">Terms &amp; Privacy</h1>
              <p className="legal-updated">Last updated {LEGAL_UPDATED}</p>
              <p className="legal-lede">
                One page, two parts: the rules for using Farpy, and exactly what data we
                handle while you do. Written to be read, not skimmed past.
              </p>
            </header>

            <nav className="legal-toc legal-toc--grouped" aria-label="On this page">
              {PARTS.map((part) => (
                <div className="legal-toc__group" key={part.id}>
                  <a className="legal-toc__label" href={`#${part.id}`}>
                    {part.title}
                  </a>
                  <div className="legal-toc__links">
                    {part.sections.map((section) => (
                      <a key={section.id} href={`#${section.id}`}>
                        {section.heading}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="legal-body">
              {PARTS.map((part) => (
                <div key={part.id}>
                  <header className="legal-part" id={part.id}>
                    <p className="legal-part__label">{part.label}</p>
                    <h2 className="legal-part__title">{part.title}</h2>
                    <p className="legal-part__lede">{part.lede}</p>
                  </header>
                  <div className="legal-body">
                    {part.sections.map((section) => (
                      <section key={section.id} id={section.id} className="legal-section">
                        <h2>{section.heading}</h2>
                        {section.body}
                      </section>
                    ))}
                  </div>
                </div>
              ))}

              <section id="contact" className="legal-section">
                <h2>Contact</h2>
                <p>
                  Questions about these terms? Email{" "}
                  <a href="mailto:support@farpy.com">support@farpy.com</a>. Questions about
                  privacy or data handling? Email{" "}
                  <a href="mailto:privacy@farpy.com">privacy@farpy.com</a>.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
