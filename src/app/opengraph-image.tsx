export const dynamic = "force-static";
export const revalidate = false;

import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

// Default social share card, inherited by every route that doesn't set its own
// (the proof pages ship the actual render as their image). Built in the brand's
// "dark world = compute" palette with the render-red glow. Text-driven and
// logo-free on purpose — drops in cleanly when the real wordmark lands.
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "radial-gradient(1100px 600px at 78% 18%, rgba(252,109,38,0.28), transparent 60%), #171321",
          color: "#ececef",
          fontFamily: "sans-serif",
        }}
      >
        {/* Wordmark + verified pill */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "999px",
                background: "#fc6d26",
                boxShadow: "0 0 40px 8px rgba(252,109,38,0.7)",
              }}
            />
            <div style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              {SITE_NAME}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "24px",
              color: "#9CA0A8",
              border: "1px solid #2A2C31",
              borderRadius: "999px",
              padding: "10px 22px",
            }}
          >
            Pay per finished frame
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "82px",
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              maxWidth: "1000px",
            }}
          >
            Render Blender on real GPUs.
          </div>
          <div style={{ display: "flex", fontSize: "82px", fontWeight: 700, letterSpacing: "-0.03em", color: "#fc6d26" }}>
            Pay by the frame.
          </div>
        </div>

        {/* Proof strip */}
        <div style={{ display: "flex", gap: "44px", fontSize: "27px", color: "#B9BCC2" }}>
          <span style={{ display: "flex" }}>$0.01 / frame</span>
          <span style={{ display: "flex" }}>Exact price in seconds</span>
          <span style={{ display: "flex" }}>Failed renders cost $0</span>
        </div>
      </div>
    ),
    { ...size },
  );
}


