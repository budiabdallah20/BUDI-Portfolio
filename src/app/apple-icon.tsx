import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — official black × gold mark. */
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
          background: "#0b0b0c",
          borderRadius: 40,
          border: "5px solid #d4af37",
          position: "relative",
        }}
      >
        <div
          style={{
            color: "#e9ce7a",
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
            background: "#d4af37",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
