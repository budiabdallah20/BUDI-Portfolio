import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * Tab icon — ember tile, lime orbit ring, bold B core, signal node.
 */
export default function Icon(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#150b05",
          borderRadius: 14,
          border: "2px solid rgba(255,61,0,0.55)",
          position: "relative",
        }}
      >
        <div
          style={{
            color: "#ffd9bd",
            fontSize: 36,
            fontWeight: 900,
            fontFamily: "sans-serif",
            lineHeight: 1,
          }}
        >
          B
        </div>
        <div
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            width: 9,
            height: 9,
            borderRadius: 999,
            background: "#ff3d00",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
