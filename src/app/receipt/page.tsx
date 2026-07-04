import type { Metadata } from "next";
import { Suspense } from "react";
import SiteNav from "@/components/SiteNav";
import ReceiptPage from "@/components/ReceiptPage";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Render receipt",
  description: "View a token-gated Farpy render receipt.",
  alternates: { canonical: "/receipt" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <SiteNav />
      <Suspense fallback={<div />}>
        <ReceiptPage />
      </Suspense>
      <SiteFooter />
    </>
  );
}
