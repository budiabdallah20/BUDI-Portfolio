/**
 * Path-traversal guard — every filesystem path built from PROJECT code must
 * be resolved through here.
 *
 * Checklist item: "منع القراءة المباشرة للملفات بناءً على مدخلات المستخدم …
 * تنظيف المسارات وعزل المجلدات" — all file access stays inside the project
 * root, and any `..`/absolute segment that would escape resolves to `null`
 * instead of throwing or leaking.
 *
 * The check is `path.relative`, which is correct on every platform:
 * - a traversal (`..\..\windows\system32`) resolves outside → rel starts ".."
 * - an absolute segment (`/etc/passwd`, `C:\`) replaces the root → same
 * - case-insensitive filesystems (win32/darwin) are handled by `path.relative`.
 */

import path from "node:path";

/**
 * Join `segments` onto `root` and return the result ONLY if it stays inside
 * `root`. Returns `null` for anything that escapes (or contains NUL bytes).
 */
export function resolveInside(root: string, ...segments: string[]): string | null {
  if (segments.some((s) => s.includes("\0"))) return null;
  const absRoot = path.resolve(root);
  const target = path.resolve(absRoot, ...segments);
  return isInside(absRoot, target) ? target : null;
}

/** True when `target` (already absolute) sits inside `root`. */
export function isInside(root: string, target: string): boolean {
  const absRoot = path.resolve(root);
  const rel = path.relative(absRoot, path.resolve(target));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}
