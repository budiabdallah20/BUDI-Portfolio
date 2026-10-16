import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * Tab icon — official black × gold mark: black tile, gold border, gold B.
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
          background: "#0b0b0c",
          borderRadius: 14,
          border: "2px solid #d4af37",
          position: "relative",
        }}
      >
        <div
          style={{
            color: "#e9ce7a",
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
            background: "#d4af37",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
