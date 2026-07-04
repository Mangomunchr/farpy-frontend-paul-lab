import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Farpy Booth",
  description: "Visit the Farpy digital booth.",
  alternates: { canonical: "/booth" },
  openGraph: {
    title: "Farpy Booth",
    description: "Visit the Farpy digital booth.",
    url: "/booth",
  },
};

const brochures = [
  { label: "Pricing", href: "/pricing", tone: "booth-brochure-red" },
  { label: "FAQ", href: "/faq", tone: "booth-brochure-gray" },
  { label: "API", href: "/api", tone: "booth-brochure-ink" },
  { label: "Blender Add-on", href: "/addon", tone: "booth-brochure-green" },
  { label: "Benchmark", href: "/downloads", tone: "booth-brochure-blue" },
  { label: "Receipts", href: "/receipt", tone: "booth-brochure-yellow" },
];

const downloads = [
  { label: "Benchmark", href: "/downloads" },
  { label: "Blender Add-on", href: "/addon" },
  { label: "Documentation", href: "/docs" },
];

export default function BoothPage() {
  return (
    <>
      <SiteNav />
      <main className="booth-page">
        <section className="booth-shell" aria-labelledby="booth-title">
          <div className="booth-hall-lights" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div className="booth-scene">
            <div className="booth-side-wall booth-side-wall-left" aria-hidden="true" />
            <div className="booth-side-wall booth-side-wall-right" aria-hidden="true" />
            <div className="booth-back-wall" aria-hidden="true" />
            <div className="booth-floor" aria-hidden="true" />

            <header className="booth-hanging-banner">
              <span className="booth-banner-cable booth-banner-cable-left" aria-hidden="true" />
              <span className="booth-banner-cable booth-banner-cable-right" aria-hidden="true" />
              <Link className="booth-logo" href="/" aria-label="Farpy home" prefetch={false}>
                <span className="booth-logo-mark" aria-hidden="true">F</span>
                <span id="booth-title">FARPY</span>
              </Link>
              <p>Distributed Blender &amp; Octane Rendering</p>
              <span className="booth-open-badge">Always Open.</span>
            </header>

            <span className="booth-number" aria-label="Booth number B-1337">Booth B-1337</span>

            <Link className="booth-tv booth-clickable" href="/showcase" aria-label="Open Farpy showcase" prefetch={false}>
              <span className="booth-tv-screen">
                <span className="booth-tv-glare" aria-hidden="true" />
                <span className="booth-play" aria-hidden="true" />
                <strong>Demo coming soon.</strong>
              </span>
              <span className="booth-tv-mount" aria-hidden="true" />
            </Link>

            <section className="booth-showcase-wall" aria-labelledby="booth-showcase-title">
              <Link className="booth-showcase-frame booth-clickable" href="/showcase" aria-label="Submit artwork to Farpy Showcase" prefetch={false}>
                <span className="booth-frame-mat">
                  <strong id="booth-showcase-title">YOUR ART HERE</strong>
                  <em>Help us replace the AI placeholders.</em>
                  <span>Submit Artwork</span>
                </span>
              </Link>
            </section>

            <section className="booth-rack" aria-labelledby="booth-rack-title">
              <h2 id="booth-rack-title">Brochure Stand</h2>
              <div className="booth-rack-body">
                {brochures.map((brochure) => (
                  <Link
                    className={`booth-brochure booth-clickable ${brochure.tone}`}
                    href={brochure.href}
                    key={brochure.label}
                    prefetch={false}
                  >
                    {brochure.label}
                  </Link>
                ))}
              </div>
            </section>

            <section className="booth-counter" aria-labelledby="booth-counter-title">
              <div className="booth-counter-top">
                <span className="booth-chompy" aria-hidden="true"><span /></span>
                <span className="booth-counter-sign">Couldn&apos;t make the conference? Welcome anyway.</span>
                <span className="booth-counter-note">Free demos. No free GPUs.</span>
              </div>
              <div className="booth-counter-front">
                <div>
                  <h2 id="booth-counter-title">Welcome.</h2>
                  <p>Need GPUs?</p>
                </div>
                <div className="booth-actions">
                  <Link className="pj-btn pj-btn--blue" href="/workspace" prefetch={false}>
                    Upload Package
                  </Link>
                  <Link className="pj-btn pj-btn--tertiary" href="/showcase" prefetch={false}>
                    Showcase
                  </Link>
                </div>
              </div>
            </section>

            <section className="booth-download-table" aria-labelledby="booth-download-title">
              <h2 id="booth-download-title">Download Table</h2>
              <div className="booth-handouts">
                {downloads.map((download) => (
                  <Link className="booth-handout booth-clickable" href={download.href} key={download.label} prefetch={false}>
                    <span aria-hidden="true" />
                    {download.label}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}