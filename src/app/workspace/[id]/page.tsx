import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const dynamicParams = false;

export const metadata: Metadata = {
  title: "Package tracker",
  description: "Open a private Farpy package tracker link.",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return [{ id: "status" }];
}

export default function StaticRenderStatusPage() {
  return (
    <>
      <div className="ws">
        <SiteNav />
        <main className="wrap render-flow-page">
          <section className="render-flow-head">
            <h1>Farpy Package Tracker</h1>
            <p>No active package selected.</p>
          </section>

          <section className="render-job-card">
            <p className="render-note">
              Package status appears only from a private workspace link created after upload.
            </p>
            <Link className="pj-btn pj-btn--blue" href="/" prefetch={false}>
              Send package
            </Link>
          </section>
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
