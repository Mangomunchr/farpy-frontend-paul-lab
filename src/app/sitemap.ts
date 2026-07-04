export const dynamic = "force-static";
export const revalidate = false;

import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { PROOFS } from "@/lib/proofs";

// Only current public routes belong here: the marketing, app shell, docs, and
// trust surface.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const core: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/pricing"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/booth"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/faq"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/docs"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/addon"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/downloads"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/showcase"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/api"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/account"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/topup"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/workspace"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/files"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/proof"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/acceptable-use"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/security"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/refunds"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/dmca"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/status"), lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const proofPages: MetadataRoute.Sitemap = PROOFS.map((proof) => ({
    url: absoluteUrl(`/proof/${proof.slug}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  return [...core, ...proofPages];
}


