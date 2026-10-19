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
  title: "خزنة بودي — تفتح 24 أكتوبر",
  description: "الخزنة الذهبية: 10 صور، فيلم الأغنية (AI)، طريق الذكريات، وأمنيات. تفتح كل 24 أكتوبر (بتوقيت القاهرة).",
  robots: { index: false, follow: false },
};

export default function BirthdayPage(): React.JSX.Element {
  return <BirthdayExperience />;
}
