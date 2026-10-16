import type { Metadata } from "next";
import BirthdayExperience from "@/components/birthday/BirthdayScreen";

/**
 * /birthday — BUDI day (Oct 24, Cairo, every year).
 * Force-dynamic + noindex: a gift page, not SEO content. The gate itself
 * resolves client-side (BirthdayExperience) so crawlers and edge caches
 * can never leak the locked state early.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BUDI Vault — Opens October 24",
  description: "The golden vault: 10 photos, AI anthem film, memories road, and wishes. Opens every October 24 (Cairo).",
  robots: { index: false, follow: false },
};

export default function BirthdayPage(): React.JSX.Element {
  return <BirthdayExperience />;
}
