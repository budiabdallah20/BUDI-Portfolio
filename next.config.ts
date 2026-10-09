import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // Every `quality={...}` used in the codebase must be listed here,
    // otherwise next/image logs "unconfigured qualities" in the console.
    qualities: [75, 90],
  },
  async headers() {
    return [
      // HTML documents must revalidate so a new deploy never serves a stale
      // page referencing deleted hashed chunks (the "stuck loading screen"
      // until Ctrl+F5). Hashed assets under /_next/ stay immutable.
      {
        source: "/:path((?!_next/|images/|fonts/).*)",
        headers: [{ key: "Cache-Control", value: "no-cache, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
