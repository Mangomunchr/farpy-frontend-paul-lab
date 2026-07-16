"use client";

import { useEffect } from "react";
import Script from "next/script";
import { GA_MEASUREMENT_ID, trackGaPageView } from "@/lib/analytics";
const FIREHOSE_URL = process.env.NEXT_PUBLIC_FIREHOSE_URL || "";
const PAGE_VIEW_EVENT = "page_view";

type PageViewPayload = {
  event: typeof PAGE_VIEW_EVENT;
  page_path: string;
  page_location: string;
  page_title: string;
};

const sanitizeAnalyticsLocation = () => {
  const pagePath = window.location.pathname;
  return {
    page_path: pagePath,
    page_location: `${window.location.origin}${pagePath}`,
  };
};

const currentPayload = (): PageViewPayload => ({
  event: PAGE_VIEW_EVENT,
  ...sanitizeAnalyticsLocation(),
  page_title: document.title,
});

const sendPageView = (payload: PageViewPayload) => {
  if (GA_MEASUREMENT_ID && typeof window.gtag === "function") {
    trackGaPageView(payload.page_path, payload.page_location, payload.page_title);
  }

  if (FIREHOSE_URL) {
    window.fetch(FIREHOSE_URL, {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => undefined);
  }
};

export default function Analytics() {
  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };

    let lastTracked = "";
    let scheduled = 0;

    const trackCurrentPage = () => {
      window.clearTimeout(scheduled);
      scheduled = window.setTimeout(() => {
        const payload = currentPayload();
        if (payload.page_location === lastTracked) return;
        lastTracked = payload.page_location;
        sendPageView(payload);
      }, 0);
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function pushState(...args) {
      const result = originalPushState.apply(this, args);
      trackCurrentPage();
      return result;
    };

    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      trackCurrentPage();
      return result;
    };

    window.addEventListener("popstate", trackCurrentPage);
    trackCurrentPage();

    return () => {
      window.clearTimeout(scheduled);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", trackCurrentPage);
    };
  }, []);

  return (
    <>
      {GA_MEASUREMENT_ID ? (
        <>
          <Script
            id="farpy-ga4-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="farpy-ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = window.gtag || gtag;
              if (!window.__farpyGa4Initialized) {
                window.__farpyGa4Initialized = true;
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
              }
            `}
          </Script>
        </>
      ) : null}
    </>
  );
}
