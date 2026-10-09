import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — larger canvas, same monogram identity as the favicon. */
export default function AppleIcon(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0b",
          borderRadius: 40,
          border: "5px solid rgba(215,253,68,0.55)",
          position: "relative",
        }}
      >
        <div
          style={{
            color: "#d7fd44",
            fontSize: 104,
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
            top: 16,
            right: 16,
            width: 26,
            height: 26,
            borderRadius: 999,
            background: "#d7fd44",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
