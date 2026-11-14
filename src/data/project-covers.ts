/** Existing portfolio cover artwork, keyed by the real repository slug. */
export const projectCovers: Record<string, string> = {
  kayan: "/images/projects/zaker-logo.svg",
  massar: "/images/projects/analytics.svg",
  "budi-s-": "/brand/budi-light.svg",
  raqib: "/images/projects/raqib-wordmark.svg",
  "dental-system": "/images/projects/budi-dental.svg",
};

export function projectCoverFor(github: string): string | undefined {
  try {
    const slug = new URL(github).pathname.split("/").filter(Boolean).at(-1)?.toLowerCase();
    return slug ? projectCovers[slug] : undefined;
  } catch {
    return undefined;
  }
}
