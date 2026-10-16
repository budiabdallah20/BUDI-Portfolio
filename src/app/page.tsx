import type { Metadata } from "next";
import HomeShell from "@/components/home/HomeShell";
import { siteConfig } from "@/config/site";
import { fetchContent } from "@/lib/content";

/**
 * ALWAYS fresh — zero stale cache, by owner demand: every dashboard edit
 * (skill hide, badge, hero/about image, anything) must appear on the live
 * site within seconds, no refresh. So this page renders on every request
 * straight from Supabase instead of serving ISR snapshots.
 * Cost: one server render + a few DB reads per visit — negligible at
 * portfolio traffic, and crawlers still get full SSR HTML for SEO.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: { canonical: siteConfig.url },
};

export default async function HomePage(): Promise<React.JSX.Element> {
  const content = await fetchContent();
  return <HomeShell content={content} />;
}
