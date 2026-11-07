import { BUDI_MARK_PATH } from "@/lib/brand";
import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

const BRAND_PATHS = [BUDI_MARK_PATH];

/**
 * Tab icon — new identity: black wireframe cube on the paper tile.
 * 64px is too small for the wordmark; the cube alone carries it.
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
          background: "#faf9f6",
          borderRadius: 14,
        }}
      >
        <svg width="46" height="46" viewBox="0 0 58 84">
          <g
            stroke="none"
            strokeWidth="20"
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
    ),
    { ...size },
  );
}
