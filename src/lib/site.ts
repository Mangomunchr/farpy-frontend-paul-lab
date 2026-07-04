// Single source of truth for site-wide SEO / GEO metadata.
//
// The canonical origin is `https://farpy.com`, overridable at build time with
// NEXT_PUBLIC_SITE_URL so a preview/staging deploy (e.g. *.vercel.app) advertises
// its own URL instead of leaking production canonicals. Everything that needs an
// absolute URL — canonicals, OG tags, sitemap, JSON-LD — derives from here.

const RAW_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://farpy.com";

export const SITE_URL = RAW_URL.replace(/\/$/, "");
export const SITE_NAME = "Farpy";

// The one-liner. Used as the default meta description and as the OG/JSON-LD
// description. Leads with the outcome (finished frames), backs it with the proof
// (exact price, $0 on failure) — the messaging spine from the brand work.
export const SITE_DESCRIPTION =
  "Farpy renders Blender and Octane files for less. Upload your scene, track delivery, and download a ZIP plus receipt.";

// Short tagline for the title default / wordmark.
export const SITE_TAGLINE = "Render Blender + Octane files for less";

// Pricing facts — kept in lockstep with PricingSection / proofs.ts so the
// machine-readable Offers never drift from the human-readable page.
export const PRICE_NORMAL = 0.01; // USD per finished frame, Normal queue
export const PRICE_FAST = 0.02; // USD per finished frame, Fast (priority) queue

// Search-intent keywords. Modern Google ignores the keywords meta, but several
// secondary engines and AI crawlers still read it, and it costs nothing.
export const SITE_KEYWORDS = [
  "Blender render farm",
  "cloud GPU rendering",
  "render Blender online",
  "pay per frame rendering",
  "Blender cloud rendering",
  "RTX 4090 render farm",
  "Cycles render farm",
  "Blender .blend render service",
  "Octane .orbx render service",
  "GPU render farm",
  "render Blender animation online",
];

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
