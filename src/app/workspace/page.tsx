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

export default function WorkspacePage() {
  return (
    <>
      <SiteNav />
      <Suspense fallback={<div />}>
        <Workspace />
      </Suspense>
      <SiteFooter />
    </>
  );
}
