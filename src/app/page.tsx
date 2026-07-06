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
        name: "Standard lane",
        description: "Standard render lane. Billed only for frames that finish.",
        price: PRICE_NORMAL,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Priority lane",
        description: "Priority lane for sooner frames where available. Optional. Same output.",
        price: PRICE_FAST,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    ],
  },
};

const trust = [
  "✓ Receipt-backed",
  "✓ SHA-256 verified",
  "✓ Wallet tracked",
  "✓ No subscription",
];

const pillarIcon = {
  shield: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-3.5 8-10V5.5L12 2 4 5.5V12c0 6.5 8 10 8 10Z" />
      <path d="m9 11.5 2 2 4-4.5" />
    </svg>
  ),
  lock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
      <path d="M7.5 10.5V7.75a4.5 4.5 0 0 1 9 0v2.75" />
    </svg>
  ),
  receipt: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2.5h14V21l-2.4-1.5L14.2 21l-2.2-1.5L9.8 21l-2.4-1.5L5 21V2.5Z" />
      <path d="m9 10.5 2 2 4-4.5" />
    </svg>
  ),
  dollar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5v19" />
      <path d="M16.5 6.5h-6.75a2.75 2.75 0 0 0 0 5.5h4.5a2.75 2.75 0 0 1 0 5.5H7" />
    </svg>
  ),
};

const pillars = [
  {
    icon: pillarIcon.shield,
    title: "Your files stay private",
    text: "Your .blend or .orbx is never sold and never used to train AI. We delete it the moment your download finishes - no archived copy, no exceptions.",
  },
  {
    icon: pillarIcon.lock,
    title: "Encrypted in transit",
    text: "Every upload and download travels over TLS. Your scene reaches the GPUs encrypted, and your finished frames come back the same way.",
  },
  {
    icon: pillarIcon.receipt,
    title: "A receipt on every render",
    text: "Each job returns a signed receipt - frame count, GPU, render time, a verifiable hash - so you can confirm it really ran, not just trust a status bar.",
  },
  {
    icon: pillarIcon.dollar,
    title: "Failed frames are free",
    text: "If a frame errors out it's refunded to your balance automatically. You only pay for frames that finish clean. A broken render costs you $0.",
  },
];

const faqs = [
  ["Do I need an account?", "You can see a price before signing in. Wallet balance, package history, downloads, and receipts work best with an account."],
  ["What happens if a frame fails?", "You are not charged for it. You only pay for frames that finish, and anything that fails is refunded to your balance."],
  ["What files can I render?", "Blender .blend files and Octane .orbx packages. Send one in and Farpy reads the scene to count frames and quote the exact price before anything runs."],
  ["How long does a render take?", "It depends on the scene. Farpy shows package progress in the workspace and keeps the receipt after delivery."],
  ["What's the difference between Standard and Priority?", "Same render, same output. Priority uses the express lane. Standard is $0.01 per frame, Priority is $0.02 per frame."],
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
              <strong>Compare real GPU benchmark results.</strong>
              <a className="fy-proof-link" href="/benchmark">View benchmarks</a>
            </article>
            <article className="pj-card fy-proof-card">
              <strong>Render from inside Blender.</strong>
              <a className="fy-proof-link" href="/addon">Install the Farpy Add-on</a>
            </article>
          </div>
        </section>

        <section className="fy-section fy-tight-section" aria-labelledby="trust-title">
          <h2 className="fy-section__title" id="trust-title">Trust</h2>
          <div className="fy-trust-grid">
            {[
              ["Receipt-backed", "A signed receipt with every package."],
              ["SHA-256 verified", "Every ZIP ships a verifiable hash."],
              ["Wallet tracked", "Each charge shows in your balance."],
              ["No subscription", "Pay per render. Nothing recurring."],
            ].map(([title, desc]) => (
              <article className="pj-card fy-trust-card" key={title}>
                <h3 className="pj-card__title">{title}</h3>
                <p className="fy-pillar__text">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="fy-section" aria-labelledby="pillars-title">
          <h2 className="fy-section__title" id="pillars-title">
            Built so you never have to take our word for it.
          </h2>
          <p className="fy-section__sub">
            Your scene, your frames, your money &mdash; handled with the same care
            you&rsquo;d want for your own work. Here&rsquo;s exactly what we promise on
            every job.
          </p>
          <div className="fy-pillars">
            {pillars.map((pillar) => (
              <section className="pj-card fy-pillar" key={pillar.title}>
                <div className="pj-card__body">
                  <span className="fy-pillar__icon" aria-hidden="true">{pillar.icon}</span>
                  <h3 className="pj-card__title">{pillar.title}</h3>
                  <p className="fy-pillar__text">{pillar.text}</p>
                </div>
              </section>
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
