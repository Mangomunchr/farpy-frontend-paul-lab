import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import RawReceiptToggle from "@/components/RawReceiptToggle";
import JsonLd from "@/components/JsonLd";
import { PROOFS, getProof, money, outputHash, rawReceipt, receiptHash } from "@/lib/proofs";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export function generateStaticParams() {
  return PROOFS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getProof(slug);
  if (!p) return {};
  const title = `${p.name} - example render receipt`;
  const description = `Example receipt: ${p.frames} frames on ${p.gpu}. Cost ${money(p.cost)}.`;
  const url = `/proof/${p.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${title} - ${SITE_NAME}`, description, type: "article", url },
    twitter: { title, description },
  };
}

export default async function ProofPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getProof(slug);
  if (!p) notFound();

  const pageUrl = absoluteUrl(`/proof/${p.slug}`);
  const receiptId = receiptHash(p);
  const ld = {
    "@context": "https://schema.org",
    "@type": "DigitalDocument",
    name: `${p.name} render receipt`,
    url: pageUrl,
    provider: { "@id": `${SITE_URL}/#organization` },
    dateCreated: p.iso,
  };

  return (
    <>
      <JsonLd data={ld} />
      <SiteNav />
      <main className="wrap render-flow-page proof-min">
        <Link className="proofpage-back" href="/" prefetch={false}>
          &lt;- Farpy
        </Link>

        <section className="render-flow-head proof-head">
          <span className="render-label">Receipt ID</span>
          <h1>{receiptId}</h1>
          <p className="proof-url">{pageUrl}</p>
        </section>

        <section className="render-job-card proof-receipt-card">
          <div className="proof-receipt-head">
            <span className="pj-badge">Example</span>
            <strong>{money(p.cost)}</strong>
          </div>
          <dl className="render-proof-lines">
            <div><dt>File name</dt><dd>{p.scene}</dd></div>
            <div><dt>Render name</dt><dd>{p.name}</dd></div>
            <div><dt>GPU used</dt><dd>{p.gpu}</dd></div>
            <div><dt>Frame count</dt><dd>{p.frames.toLocaleString()}</dd></div>
            <div><dt>Render duration</dt><dd>{p.duration}</dd></div>
            <div><dt>Cost</dt><dd>{money(p.cost)}</dd></div>
            <div><dt>Output hash</dt><dd>{outputHash(p)}</dd></div>
            <div><dt>Public proof URL</dt><dd className="proof-url-value">{pageUrl}</dd></div>
          </dl>
          <div className="render-actions">
            <RawReceiptToggle json={rawReceipt(p)} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
