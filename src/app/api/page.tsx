import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import ApiPage from "@/components/ApiPage";
import SiteFooter from "@/components/SiteFooter";

const title = "API";
const description =
  "A small, read-only REST API for renders you start on the web or in the Blender add-on. Check progress, pull a receipt as JSON, and download finished frames. Plain REST + JSON.";

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
