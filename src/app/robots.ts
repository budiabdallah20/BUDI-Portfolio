import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The console, the splash and the gift page must never enter a
        // search index — /admin is a PIN wall, not content. (The per-page
        // `robots: { index: false }` metadata is the second line of defence;
        // this keeps crawlers from fetching /admin at all.)
        disallow: ["/admin", "/api/", "/birthday"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}