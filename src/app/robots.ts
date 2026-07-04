export const dynamic = "force-static";
export const revalidate = false;

import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/site";

// Crawlers may have everything except the signed-in app surface (workspace,
// account, billing, auth). Those are per-user, gated, and have no search value —
// keeping them out of the index avoids thin/duplicate results and soft-404s.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/workspace", "/account", "/topup", "/signin", "/signup"],
      },
    ],
    sitemap: [absoluteUrl("/sitemap.xml"), absoluteUrl("/benchmark/sitemap.xml")],
    host: SITE_URL,
  };
}

