const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://budi-portfolio.vercel.app";

export const siteConfig = {
  name: "Mohamed Abdallah",
  shortName: "BUDI",
  title: "BUDI — Mohamed Abdallah, Full-Stack Developer",
  description:
    "BUDI (Mohamed Abdallah) — Full-Stack Developer from Suez, Egypt. Building fast, modern, secure web platforms with React, Next.js and TypeScript. Available for freelance and full-time work.",
  url: siteUrl,
  locale: "en_US",
  themeColor: "#0a0a0b",
  author: "Mohamed Abdallah",
  keywords: [
    "Mohamed Abdallah",
    "BUDI",
    "BUDI portfolio",
    "Full-Stack Developer",
    "Frontend Developer",
    "React developer",
    "Next.js developer",
    "TypeScript developer",
    "Tailwind CSS",
    "Web developer Suez",
    "Web developer Egypt",
    "freelance developer",
    "hire full-stack developer",
    "portfolio",
  ],
} as const;

export type SiteConfig = typeof siteConfig;
