import JsonLd from "@/components/JsonLd";

export const FAQS = [
  {
    q: "Do I need an account?",
    a: "You can see a price before signing in. Stored wallet balance, topups, and account package history require email sign-in.",
  },
  {
    q: "How much does it cost?",
    a: "Standard renders are $0.01 per frame. Priority renders are $0.02 per frame where the priority queue is available. The quote is shown before the render starts. Start with a small package.",
  },
  {
    q: "What is the $0.25 signup credit?",
    a: "It is wallet credit for new accounts when the signup credit is available. It is not a separate free-frame system.",
  },
  {
    q: "What files can I render?",
    a: "Upload .blend files for Blender or .orbx files for Octane. A package is your uploaded render file plus the frame settings Farpy needs to send it to a render partner.",
  },
  {
    q: "Can I render animations?",
    a: "Blender animations are supported: enter the number of frames you want rendered. Farpy is best for previews, tests, splash screens, and short frame ranges today. Octane public alpha is still-only.",
  },
  {
    q: "What is Farpy best for today?",
    a: "Farpy is early access production alpha. It is best for small Blender and Octane render packages, quick previews, tests, splash screens, and short jobs. Test before sending larger work.",
  },
  {
    q: "What happens if a render fails?",
    a: "Failed renders cost $0. If a road is closed at the render partner and a wallet-funded render fails after debit, the debit should be refunded to your balance.",
  },
  {
    q: "How long do downloads stay available?",
    a: "Downloads are retained for the beta delivery window and may be removed during storage cleanup, abuse prevention, or maintenance.",
  },
  {
    q: "Are uploads private?",
    a: "Uploads are used to quote and run your render. Download and receipt links use private job tokens. Do not share those links unless you want the recipient to access the job.",
  },
  {
    q: "Do you train AI on uploads?",
    a: "No. Farpy does not use uploaded files or rendered outputs to train AI models.",
  },
  {
    q: "How do refunds work?",
    a: "If a payment, wallet debit, package, render, or delivery receipt is wrong, contact support with the job and payment details. Failed renders should cost $0 or be refunded to wallet balance.",
  },
  {
    q: "What renderers are supported?",
    a: "Farpy supports Blender .blend rendering and Octane .orbx still rendering in public alpha.",
  },
  {
    q: "What does Octane support mean?",
    a: "Octane public alpha accepts .orbx files for still renders only. The frame count is locked to 1 and pricing uses 1 frame.",
  },
  {
    q: "Can I render adult/private/client work?",
    a: "Private client work is allowed when you have the rights and permission to render it. Adult content is case-by-case and must comply with applicable law and the Acceptable Use policy. Illegal content, exploitative content, and content involving minors are prohibited.",
  },
  {
    q: "What should I include when contacting support?",
    a: "Include your job_id, receipt_id, account email, payment intent if available, and a short description of what happened.",
  },
  {
    q: "What is a delivery receipt?",
    a: "A delivery receipt proves what happened: Job ID, Receipt ID, renderer, frame count, cost, and SHA-256 output proof stay available for advanced checks.",
  },
];

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqSection() {
  return (
    <section id="faq" className="bg-paper">
      <JsonLd data={faqLd} />
      <div className="wrap py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start" data-reveal>
            <h2 className="section-title">The honest answers.</h2>
            <p className="section-lede">
              Every scene is different, so Farpy shows price before work starts.
              These are the public-alpha basics. Start with a small package.
            </p>

            <div className="faq-aside">
              <p className="faq-aside-q">Still not sure it fits your scene?</p>
              <p className="faq-aside-a">
                Upload a small package first and you will see the exact price before rendering.
                Stored balance and history use email sign-in.
              </p>
              <a className="faq-aside-link" href="#start">
                Get your price
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14m-6-6 6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div className="faq-list" data-reveal-group data-reveal-step="70">
            {FAQS.map((f) => (
              <details key={f.q} className="faq-item" data-reveal>
                <summary className="faq-summary">
                  <span className="faq-q">
                    <span className="faq-tick" aria-hidden />
                    {f.q}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="faq-chevron h-5 w-5 flex-none text-ink-3"
                  >
                    <path
                      d="m6 9 6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </summary>
                <p className="faq-answer">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
