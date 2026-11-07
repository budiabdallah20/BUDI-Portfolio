import { BUDI_MARK_PATH, BUDI_WORDMARK_PATH } from "@/lib/brand";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BRAND_PATHS = [BUDI_MARK_PATH];

/**
 * Social share card — new identity: paper background, the black wireframe
 * cube, heavy black BUDI wordmark. Monochrome, nothing else competes.
 */
export default function OgImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 84,
          background: "#faf9f6",
          color: "#0A0A0A",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div
            style={{
              width: 200,
              height: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 44,
              background: "#ffffff",
              border: "2px solid rgba(10,10,10,0.1)",
            }}
          >
            <svg width="148" height="148" viewBox="0 0 58 84">
              <g
                stroke="none"
                strokeWidth="17"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="#0A0A0A"
              >
                {BRAND_PATHS.map((d) => (
                  <path key={d} d={d} fillRule="evenodd" />
                ))}
              </g>
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: 4, lineHeight: 1 }}>
              BUDI
            </div>
            <div style={{ marginTop: 14, fontSize: 26, letterSpacing: 3, color: "rgba(10,10,10,0.6)" }}>
              FULL-STACK DEVELOPER
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
            Mohamed Abdallah
          </div>
          <div style={{ marginTop: 16, fontSize: 30, color: "rgba(10,10,10,0.65)" }}>
            React · Next.js · TypeScript
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid rgba(10,10,10,0.18)",
            paddingTop: 26,
          }}
        >
          <div style={{ fontSize: 24, letterSpacing: 2, color: "rgba(10,10,10,0.55)" }}>
            Suez, Egypt — EN / FR
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#0A0A0A" }}>
            {new URL(siteConfig.url).host}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
