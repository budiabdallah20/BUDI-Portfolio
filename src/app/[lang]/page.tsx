import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomeShell from "@/components/home/HomeShell";
import { siteConfig } from "@/config/site";
import { fetchContent } from "@/lib/content";
import { isLang } from "@/i18n/dictionaries";

/**
 * ALWAYS fresh — zero stale cache, by owner demand: every dashboard edit
 * (skill hide, badge, hero/about image, anything) must appear on the live
 * site within seconds, no refresh. So this page renders on every request
 * straight from Supabase instead of serving ISR snapshots.
 * Cost: one server render + a few DB reads per visit — negligible at
 * portfolio traffic, and crawlers still get full SSR HTML for SEO.
 */
export const dynamic = "force-dynamic";

interface LangRouteParams {
  lang: string;
}

/** The URL owns the language — /en and /fr are the only valid homes. */
export async function generateMetadata({
  params,
}: {
  params: Promise<LangRouteParams>;
}): Promise<Metadata> {
  const { lang } = await params;
  const valid = isLang(lang) ? lang : "en";
  return {
    title: siteConfig.title,
    description: siteConfig.description,
    alternates: {
      canonical: `${siteConfig.url}/${valid}`,
      languages: {
        en: `${siteConfig.url}/en`,
        fr: `${siteConfig.url}/fr`,
        "x-default": `${siteConfig.url}/en`,
      },
    },
    openGraph: {
      locale: valid === "fr" ? "fr_FR" : "en_US",
      url: `${siteConfig.url}/${valid}`,
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<LangRouteParams>;
}): Promise<React.JSX.Element> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const content = await fetchContent();
  return <HomeShell content={content} />;
}
