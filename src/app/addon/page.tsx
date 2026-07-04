import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import AddonPage from "@/components/AddonPage";
import SiteFooter from "@/components/SiteFooter";

const title = "Farpy Render Delivery Blender add-on";
const description =
  "Download the Farpy Render Delivery Blender add-on, send .blend packages, track delivery, and open delivery receipts.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/addon" },
  openGraph: { title, description, url: "/addon", type: "website" },
  twitter: { title, description },
};

export default function AddonRoute() {
  return (
    <>
      <SiteNav />
      <AddonPage />
      <SiteFooter />
    </>
  );
}
