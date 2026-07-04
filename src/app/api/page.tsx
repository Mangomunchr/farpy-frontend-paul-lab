import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import ApiPage from "@/components/ApiPage";
import SiteFooter from "@/components/SiteFooter";

const title = "Beta API";
const description =
  "Farpy public beta API endpoints for anonymous upload, job status, checkout, render submit, download, and receipt access.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/api" },
  openGraph: { title, description, url: "/api", type: "website" },
  twitter: { title, description },
};

export default function ApiRoute() {
  return (
    <>
      <SiteNav />
      <ApiPage />
      <SiteFooter />
    </>
  );
}
