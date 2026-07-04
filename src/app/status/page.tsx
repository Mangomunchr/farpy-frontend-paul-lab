import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Status",
  description: "Farpy public beta status and public health links.",
  alternates: { canonical: "/status" },
};

const HEALTH_LINKS = [
  { label: "Web render API health", href: "/node/v1/web-render/health" },
  { label: "Render partner status", href: "/node/v1/web-render/worker/status" },
];

const STATUS_PILLARS = [
  {
    title: "Website",
    status: "green",
    label: "Green",
    text: "Public pages, signup, docs, and status are available.",
  },
  {
    title: "Wallet",
    status: "yellow",
    label: "Limited visibility",
    text: "Balance, card top-ups, charges, and refunds are available; Bitcoin top-up visibility is limited during alpha.",
  },
  {
    title: "Rendering",
    status: "green",
    label: "Green",
    text: "Upload, price, render, and package progress are available for small Blender and Octane packages.",
  },
  {
    title: "Render partners",
    status: "yellow",
    label: "Limited visibility",
    text: "Available GPU render partners are active, with limited visibility during controlled alpha.",
  },
  {
    title: "Downloads",
    status: "green",
    label: "Green",
    text: "ZIP outputs and completed packages are available from package tracker and receipt links.",
  },
  {
    title: "Receipts",
    status: "green",
    label: "Green",
    text: "Delivery receipts include SHA-256, cost, renderer, and frame count.",
  },
];

export default function StatusPage() {
  return (
    <>
      <SiteNav />
      <main className="legal">
        <div className="wrap">
          <div className="legal-inner">
            <header className="legal-head">
              <p className="legal-eyebrow">Status</p>
              <h1 className="legal-title">Farpy status</h1>
              <p className="legal-lede">
                Public beta package delivery status is checked through public health endpoints. Farpy is best for small render packages today. These links do not expose secrets or private file paths.
              </p>
            </header>

            <div className="legal-body">
              <section className="legal-section">
                <h2>Public status</h2>
                <div className="status-pillars" aria-label="Farpy public status areas">
                  {STATUS_PILLARS.map((pillar) => (
                    <article className="status-pillar-card" key={pillar.title}>
                      <div className="status-pillar-head">
                        <h3>{pillar.title}</h3>
                        <span className={`status-pill status-pill-${pillar.status}`}>{pillar.label}</span>
                      </div>
                      <p>{pillar.text}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="legal-section">
                <h2>Health checks</h2>
                <ul>
                  {HEALTH_LINKS.map((link) => (
                    <li key={link.href}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
