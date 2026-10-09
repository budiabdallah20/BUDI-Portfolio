import type { Metadata } from "next";
import HomeShell from "@/components/home/HomeShell";
import { siteConfig } from "@/config/site";
import { fetchContent } from "@/lib/content";

/** Fresh content at most a minute old — realtime pushes land even sooner. */
export const revalidate = 60;

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: { canonical: siteConfig.url },
};

export default async function HomePage(): Promise<React.JSX.Element> {
  const content = await fetchContent();
  return <HomeShell content={content} />;
}
