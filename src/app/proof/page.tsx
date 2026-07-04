import type { Metadata } from "next";

import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import { PublicProofPage } from "@/components/PublicProofPage";

export const metadata: Metadata = {
  title: "Farpy Proof",
  description: "Public-safe evidence that Farpy services, benchmark results, and downloads are live.",
  alternates: { canonical: "/proof" },
  openGraph: {
    title: "Farpy Proof",
    description: "Public-safe evidence that Farpy services, benchmark results, and downloads are live.",
    type: "website",
    url: "/proof",
  },
};

export default function ProofIndexPage() {
  return (
    <>
      <SiteNav />
      <PublicProofPage />
      <SiteFooter />
    </>
  );
}
