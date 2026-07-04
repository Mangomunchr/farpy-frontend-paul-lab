import Link from "next/link";

export default function NotFound() {
  return (
    <main className="fy-shell" style={{ paddingBlock: "96px" }}>
      <p className="legal-eyebrow">Page unavailable</p>
      <h1>We could not find that Farpy page.</h1>
      <p className="fy-muted">Return home or open your workspace to keep tracking packages.</p>
      <div className="showcase-actions" style={{ marginTop: "24px" }}>
        <Link className="pj-btn pj-btn--blue" href="/">
          Go home
        </Link>
        <Link className="pj-btn pj-btn--secondary" href="/workspace">
          Open workspace
        </Link>
      </div>
    </main>
  );
}
