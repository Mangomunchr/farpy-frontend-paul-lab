import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import HomeRenderFlow from "@/components/HomeRenderFlow";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, PRICE_NORMAL, PRICE_FAST } from "@/lib/site";

const serviceLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${SITE_URL}/#service`,
  name: `${SITE_NAME} - Blender and Octane render packages`,
  serviceType: "Early access cloud rendering for small Blender and Octane packages",
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  provider: { "@id": `${SITE_URL}/#organization` },
  areaServed: "Worldwide",
  audience: { "@type": "Audience", audienceType: "3D artists, Blender users, and Octane users" },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: PRICE_NORMAL,
    highPrice: PRICE_FAST,
    offerCount: 2,
    unitText: "per finished frame",
    offers: [
      {
        "@type": "Offer",
        name: "Normal lane",
        description: "Standard render lane. Billed only for frames that finish.",
        price: PRICE_NORMAL,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Express lane",
        description: "Express lane for sooner frames where available. Optional. Same output.",
        price: PRICE_FAST,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    ],
  },
};

const steps = ["Upload package", "Render Partners process it", "Download package + receipt"];

const trust = [
  "✓ Receipt-backed",
  "✓ SHA-256 verified",
  "✓ Wallet tracked",
  "✓ No subscription",
];

const limits = [
  "Best for small render packages today.",
  "Built for Blender and Octane previews and tests.",
  "Test before sending larger work.",
];

const faqs = [
  ["Do I need an account?", "You can see a price before signing in. Wallet balance, package history, downloads, and receipts work best with an account."],
  ["What happens if a frame fails?", "You are not charged for it. You only pay for frames that finish, and anything that fails is refunded to your balance."],
  ["What files can I render?", "Blender .blend files and Octane .orbx packages. Send one in and Farpy reads the scene to count frames and quote the exact price before anything runs."],
  ["How long does a render take?", "It depends on the scene. Farpy shows package progress in the workspace and keeps the receipt after delivery."],
  ["What's the difference between Normal and Fast?", "Same render, same output. Fast uses the express lane. Normal is $0.01 per frame, Fast is $0.02 per frame."],
  ["Can you render private or adult work?", "Private work: yes. Adult content: case-by-case and must comply with applicable laws and our Acceptable Use Policy. Illegal content, exploitative content, or content involving minors is prohibited. Files are retained according to Farpy operational policies."],
  ["How does Farpy handle uploads?", "Farpy uses uploads to quote and run render jobs. Files are retained according to Farpy operational policies, never sold, and not used to train AI."],
];

export default function Home() {
  return (
    <>
      <JsonLd data={serviceLd} />
      <SiteNav />
      <div className="fy-shell home-page-v1">
        <HomeRenderFlow />

        <section className="fy-section fy-tight-section fy-proof-strip-section" aria-labelledby="proof-title">
          <h2 className="fy-section__title" id="proof-title">Proof</h2>
          <div className="fy-proof-strip-card">
            <strong>Every completed package produces a verified receipt.</strong>
            <span>No fake render counts, no fake telemetry, no hidden subscription.</span>
          </div>
          <div className="fy-conversion-grid">
            <article className="pj-card fy-proof-card">
              <strong>Sample render gallery</strong>
              <span>Sample render gallery coming after Alpha User #1.</span>
            </article>
            <article className="pj-card fy-proof-card">
              <strong>Compare real GPU benchmark results.</strong>
              <a className="fy-proof-link" href="/benchmark">View benchmarks</a>
            </article>
            <article className="pj-card fy-proof-card">
              <strong>Render from inside Blender.</strong>
              <a className="fy-proof-link" href="/addon">Install the Farpy Add-on</a>
            </article>
          </div>
        </section>

        <section className="fy-section fy-tight-section" aria-labelledby="how-title">
          <h2 className="fy-section__title" id="how-title">How it works</h2>
          <ol className="fy-steps">
            {steps.map((title, index) => (
              <li className="fy-step" key={title}>
                <span className="fy-step__num">0{index + 1}</span>
                <span className="fy-step__title">{title}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="fy-section fy-tight-section" aria-labelledby="trust-title">
          <h2 className="fy-section__title" id="trust-title">Trust</h2>
          <div className="fy-trust-grid">
            {["Receipt-backed", "SHA-256 verified", "Wallet tracked", "No subscription"].map((title) => (
              <article className="pj-card fy-trust-card" key={title}>
                <strong>{title}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="fy-section fy-tight-section" aria-labelledby="limits-title">
          <h2 className="fy-section__title" id="limits-title">Best used for</h2>
          <div className="fy-trust-grid">
            {limits.map((title) => (
              <article className="pj-card fy-trust-card" key={title}>
                <strong>{title}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="fy-section" aria-labelledby="faq-title" id="faq">
          <h2 className="fy-section__title" id="faq-title">FAQ</h2>
          <div className="fy-faq">
            {faqs.map(([q, a]) => (
              <details className="pj-accordion" key={q}>
                <summary className="pj-accordion__trigger">
                  {q}
                  <span className="pj-icon pj-accordion__chevron" aria-hidden="true" />
                </summary>
                <div className="pj-accordion__body">{a}</div>
              </details>
            ))}
          </div>
          <a className="pj-btn pj-btn--blue fy-section-cta" href="#dropzone">
            Send package
          </a>
        </section>
      </div>
      <SiteFooter />
    </>
  );
}
