// Download the finished frames. The backend hands back a real `output_url`
// (a signed ZIP of the rendered frames) on DONE jobs — we just follow it. No
// fabricated archive: if there's no output URL yet, the caller shouldn't have
// offered the button (see `canDownload`), but we fail safe by returning false.

import type { Render } from "./renderStore";

export function downloadRender(r: Pick<Render, "outputUrl" | "scene">): boolean {
  if (!r.outputUrl) return false;
  if (typeof window === "undefined") return false;

  const a = document.createElement("a");
  a.href = r.outputUrl;
  a.rel = "noopener";
  // hint a filename; the server's Content-Disposition wins if it sets one
  const base = (r.scene || "render").replace(/\.blend$/i, "");
  a.download = `${base}_frames.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return true;
}
