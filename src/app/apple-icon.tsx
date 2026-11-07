import { BUDI_MARK_PATH } from "@/lib/brand";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const BRAND_PATHS = [BUDI_MARK_PATH];

/** Apple touch icon — new identity: black wireframe cube on the paper tile. */
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
          background: "#faf9f6",
          borderRadius: 40,
        }}
      >
        <svg width="140" height="140" viewBox="0 0 58 84">
          <g
            stroke="none"
            strokeWidth="19"
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
