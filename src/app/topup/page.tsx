import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import TopUpPage from "@/components/TopUpPage";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Top up balance",
  description: "Add Farpy render balance in $10, $25, $50, or $100 increments.",
  alternates: { canonical: "/topup" },
  robots: { index: false, follow: false },
};

export default function TopUpRoute() {
  return (
    <>
      <SiteNav />
      <TopUpPage />
      <SiteFooter />
    </>
  );
}
