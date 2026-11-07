import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "BUDI — Mohamed Abdallah",
  robots: { index: false, follow: false },
};

/**
 * The root opens the localized home — the URL carries the language:
 * /en or /fr (like holden.io style locales). Priority:
 *  1. legacy ?lang=fr links → /fr (permanent habit fix)
 *  2. stored budi-lang cookie → that language
 *  3. English (default)
 */
export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}): Promise<never> {
  const { lang: legacyParam } = await searchParams;
  const legacy = Array.isArray(legacyParam) ? legacyParam[0] : legacyParam;
  if (legacy === "en" || legacy === "fr") {
    redirect(`/${legacy}`);
  }
  let preferred = "en";
  try {
    const store = await cookies();
    const saved = store.get("budi-lang")?.value;
    if (saved === "en" || saved === "fr") preferred = saved;
  } catch {
    /* no cookie store — default English */
  }
  redirect(`/${preferred}`);
}
