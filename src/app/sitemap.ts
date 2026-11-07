import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/** Every public URL ships in both localized homes (/en, /fr). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const now = new Date();
  const langs = { en: `${base}/en`, fr: `${base}/fr` };
  const localized = (path: string, changeFrequency: "weekly" | "monthly", priority: number) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
    alternates: { languages: { ...langs, "x-default": langs.en } },
  });
  return [
    localized("/en", "weekly", 1),
    localized("/fr", "weekly", 0.95),
    localized("/en#projects", "weekly", 0.9),
    localized("/en#services", "weekly", 0.85),
    localized("/en#skills", "monthly", 0.8),
    localized("/en#certificates", "monthly", 0.75),
    localized("/en#about", "monthly", 0.7),
    localized("/en#contact", "monthly", 0.7),
    { url: `${base}/security`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];
}
