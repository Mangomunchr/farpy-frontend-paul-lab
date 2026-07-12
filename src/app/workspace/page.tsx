import type { Metadata } from "next";
import { Suspense } from "react";
import SiteNav from "@/components/SiteNav";
import Workspace from "@/components/Workspace";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Package tracker",
  description:
    "Track one active Farpy package from upload to ZIP download and receipt access.",
  alternates: { canonical: "/workspace" },
  robots: { index: false, follow: false },
};

function WorkspaceLoading() {
  return (
    <div className="ws">
      <main className="wrap render-flow-page render-dashboard">
        <section className="render-flow-head render-dashboard-head">
          <div>
            <span className="render-label">Package tracker</span>
            <h1>Package tracker</h1>
            <p>Track your render from upload to download.</p>
          </div>
        </section>
        <section
          className="render-job-card"
          role="status"
          aria-live="polite"
          style={{ minHeight: "360px" }}
        >
          <p className="render-note">Loading package tracker&hellip;</p>
        </section>
      </main>
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <>
      <SiteNav />
      <Suspense fallback={<WorkspaceLoading />}>
        <Workspace />
      </Suspense>
      <SiteFooter />
    </>
  );
}
