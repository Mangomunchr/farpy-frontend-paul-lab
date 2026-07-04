import type { Metadata } from "next";
import AccountPage from "@/components/AccountPage";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Account",
  description: "View Farpy balance, package history, delivery receipts, and wallet transactions.",
  alternates: { canonical: "/account" },
  robots: { index: false, follow: false },
};

export default function AccountRoute() {
  return (
    <>
      <AccountPage />
      <SiteFooter />
    </>
  );
}
