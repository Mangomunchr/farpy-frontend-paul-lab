export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-X0KC9HNPRJ";

export type AnalyticsEventName =
  | "package_upload_started"
  | "package_upload_completed"
  | "render_priced"
  | "render_submitted"
  | "topup_started"
  | "topup_completed"
  | "render_completed"
  | "render_downloaded"
  | "receipt_viewed"
  | "addon_downloaded"
  | "nodemuncher_clicked";

export type SafeAnalyticsMetadata = {
  frame_count?: number | null;
  renderer?: string | null;
  price_cents?: number | null;
  file_type?: string | null;
  status?: string | null;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __farpyGa4Initialized?: boolean;
  }
}

const ONCE_PREFIX = "farpy.analytics.once.";
const SAFE_CATEGORY = /^[a-z0-9_-]{1,40}$/i;

const getGtag = () => {
  if (typeof window === "undefined") return null;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
  return window.gtag;
};

const safeMetadata = (metadata: SafeAnalyticsMetadata) => {
  const result: Record<string, string | number> = {};
  for (const key of ["frame_count", "price_cents"] as const) {
    const value = metadata[key];
    if (Number.isFinite(value) && Number(value) >= 0) result[key] = Math.round(Number(value));
  }
  for (const key of ["renderer", "file_type", "status"] as const) {
    const value = metadata[key];
    if (typeof value === "string" && SAFE_CATEGORY.test(value)) result[key] = value.toLowerCase();
  }
  return result;
};

export const trackAnalyticsEvent = (event: AnalyticsEventName, metadata: SafeAnalyticsMetadata = {}) => {
  const gtag = getGtag();
  if (!gtag) return false;
  gtag("event", event, safeMetadata(metadata));
  return true;
};

export const trackAnalyticsEventOnce = (
  event: AnalyticsEventName,
  dedupeKey: string,
  metadata: SafeAnalyticsMetadata = {},
) => {
  if (typeof window === "undefined") return false;
  const storageKey = `${ONCE_PREFIX}${event}.${dedupeKey}`;
  try {
    if (window.sessionStorage.getItem(storageKey)) return false;
  } catch {
    return trackAnalyticsEvent(event, metadata);
  }
  if (!trackAnalyticsEvent(event, metadata)) return false;
  try {
    window.sessionStorage.setItem(storageKey, "1");
  } catch {
    // The event was queued; storage denial must not affect the customer action.
  }
  return true;
};

export const resetAnalyticsEventOnce = (event: AnalyticsEventName, dedupeKey: string) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(`${ONCE_PREFIX}${event}.${dedupeKey}`);
  } catch {
    // Storage is optional and must not affect checkout.
  }
};

export const trackGaPageView = (pagePath: string, pageLocation: string, pageTitle: string) => {
  const gtag = getGtag();
  if (!GA_MEASUREMENT_ID || !gtag) return;
  gtag("event", "page_view", {
    page_path: pagePath,
    page_location: pageLocation,
    page_title: pageTitle,
  });
};
