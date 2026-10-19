import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/#projects`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/#services`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/#skills`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/#certificates`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/#about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/#contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/security`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];
}