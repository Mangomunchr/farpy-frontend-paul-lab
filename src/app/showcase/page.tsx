import type { Metadata } from "next";
import ShowcaseForm from "@/components/ShowcaseForm";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Farpy Showcase | Blender and Octane Artist Features",
  description:
    "Submit Blender, Octane, VFX, and 3D artwork for Farpy Showcase. Selected artists may be featured in Farpy launch videos, posts, and portfolio spotlights.",
  alternates: { canonical: "/showcase" },
  openGraph: {
    title: "Farpy Showcase",
    description:
      "Submit Blender, Octane, VFX, and 3D artwork for Farpy Showcase artist features.",
    url: "/showcase",
  },
};

export default function ShowcasePage() {
  return (
    <>
      <SiteNav />
      <main className="showcase-page">
        <section className="showcase-simple fy-shell" aria-labelledby="showcase-title">
          <div className="showcase-simple-head">
            <h1 id="showcase-title">Farpy Showcase</h1>
            <p>Submit your Blender or Octane project.</p>
            <p>If we think it&apos;s a good fit, we&apos;ll reach out.</p>
          </div>

          <ShowcaseForm />

          <p className="showcase-legal-note">
            You keep all rights. Submission does not guarantee selection. We&apos;ll contact
            selected artists before anything is published.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
