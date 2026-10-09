const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://budi-portfolio.vercel.app";

export const siteConfig = {
  name: "Mohamed Abdallah",
  shortName: "BUDI",
  title: "BUDI — Full-Stack Developer",
  description:
    "BUDI — Mohamed Abdallah, a full-stack developer from Suez, Egypt. I build fast, modern, secure web platforms with React, Next.js and TypeScript. Available for work.",
  url: siteUrl,
  locale: "en_US",
  themeColor: "#0a0a0b",
  author: "Mohamed Abdallah",
  keywords: [
    "Mohamed Abdallah",
    "BUDI",
    "Full-Stack Developer",
    "Frontend Developer",
    "React",
    "Next.js",
    "TypeScript",
    "Tailwind CSS",
    "Suez",
    "Egypt",
    "portfolio",
  ],
} as const;

export type SiteConfig = typeof siteConfig;
