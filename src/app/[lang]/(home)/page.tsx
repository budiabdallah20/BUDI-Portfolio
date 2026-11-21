import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import dynamicComponent from "next/dynamic";
import EditorialLanding from "@/components/home/EditorialLanding";
import { siteConfig } from "@/config/site";
import { getHomeVisibility } from "@/config/home-visibility";
import { fetchContent } from "@/lib/content";
import { isLang } from "@/i18n/dictionaries";

const LegacyHome = dynamicComponent(() => import("@/components/home/HomeShell"));

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
  searchParams,
}: {
  params: Promise<LangRouteParams>;
  searchParams: Promise<{ sections?: string | string[] }>;
}): Promise<React.JSX.Element> {
  const { lang } = await params;
  if (lang === "ar") redirect("/en");
  if (!isLang(lang)) notFound();
  const [content, { sections }] = await Promise.all([fetchContent(), searchParams]);
  const visibility = getHomeVisibility(sections);
  const instaPayLink = URL.parse(process.env.BUDI_INSTAPAY_LINK?.trim() ?? "");
  const instaPayHref = instaPayLink?.origin === "https://ipn.eg" &&
    !instaPayLink.username && !instaPayLink.password && instaPayLink.pathname.startsWith("/S/")
    ? instaPayLink.href
    : undefined;
  return process.env.BUDI_PORTFOLIO_LAYOUT === "legacy"
    ? <LegacyHome content={content} visibility={visibility} />
    : <EditorialLanding content={content} visibility={visibility} instaPayHref={instaPayHref} />;
}
