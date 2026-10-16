import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social share card — official black × gold identity: gold mark, name,
 * role, stack strip and URL footer. No slogan.
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
          padding: 80,
          background: "linear-gradient(120deg, #050505 0%, #1a1405 55%, #050505 100%)",
          color: "#f5eed6",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 104,
              height: 104,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 26,
              border: "3px solid #d4af37",
              background: "#0b0b0c",
              color: "#e9ce7a",
              fontSize: 62,
              fontWeight: 900,
              position: "relative",
            }}
          >
            B
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, letterSpacing: 10, color: "#e9ce7a" }}>BUDI</div>
            <div style={{ fontSize: 22, color: "rgba(245,238,214,0.65)" }}>
              Suez, Egypt · EN / FR
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1 }}>
            Mohamed Abdallah
          </div>
          <div style={{ marginTop: 14, fontSize: 36, color: "#d4af37" }}>
            FULL-STACK DEVELOPER
          </div>
          <div style={{ marginTop: 12, fontSize: 26, color: "rgba(245,238,214,0.7)" }}>
            React · Next.js · TypeScript
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid rgba(212,175,55,0.5)",
            paddingTop: 24,
          }}
        >
          <div style={{ fontSize: 24, color: "#e9ce7a" }}>
            Fast. Clean. Reliable.
          </div>
          <div style={{ fontSize: 24, color: "rgba(245,238,214,0.7)" }}>
            {new URL(siteConfig.url).host}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
