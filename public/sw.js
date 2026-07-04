// FARPY_SW_VERSION=20260623_WORKSPACE_UX_V1
// Launch service worker: keep Farpy online behavior simple and avoid stale
// Next.js chunks after static deploys. Farpy does not need offline caching.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {
        // ignore
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isNavigation = request.mode === "navigate" || request.destination === "document";
  const isNextStatic = url.origin === self.location.origin && url.pathname.startsWith("/_next/static/");

  if (!isNavigation && !isNextStatic) return;

  event.respondWith(
    fetch(new Request(request, { cache: "no-store" })).catch(() => {
      if (isNavigation) return Response.error();
      return Response.error();
    }),
  );
});
