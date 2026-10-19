import { revalidatePath } from "next/cache";

/**
 * Purge every cached content surface after an admin write.
 *
 * `revalidatePath("/")` alone is NOT enough: /api/content carries its own
 * `revalidate = 60` window, so a dashboard save used to leave that route
 * stale for up to a minute. The dashboard reloads its snapshot from
 * /api/content right after a write — reading the stale copy made saved
 * edits look lost and could overwrite them with old cloud data.
 *
 * Returns the paths that were actually purged (a static export has no ISR
 * cache → empty list, same as the previous try/catch behavior).
 */
export const CONTENT_PATHS = ["/", "/api/content"] as const;

export function purgeContentCache(): string[] {
  const paths: string[] = [];
  for (const path of CONTENT_PATHS) {
    try {
      revalidatePath(path);
      paths.push(path);
    } catch {
      /* static export — nothing to purge */
    }
  }
  return paths;
}
