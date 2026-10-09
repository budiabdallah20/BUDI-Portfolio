export type AcademicStatus = { kind: "studying"; level: 1 | 2 | 3 | 4 } | { kind: "graduated" };

const ENTRY_YEAR = 2025;
const ENTRY_MONTH = 7; // August (0-indexed) — academic year rollover
const GRAD_YEAR = 2029;

/**
 * Academic standing derived from the wall clock:
 * Aug 2025→Jul 2026 = Level 1 … Aug 2028→Jul 2029 = Level 4,
 * anything from Aug 2029 on = graduated.
 */
export function getAcademicStatus(now: Date = new Date()): AcademicStatus {
  if (now.getTime() >= new Date(GRAD_YEAR, ENTRY_MONTH, 1).getTime()) {
    return { kind: "graduated" };
  }
  const level = now.getFullYear() - ENTRY_YEAR + (now.getMonth() >= ENTRY_MONTH ? 1 : 0);
  const clamped = Math.min(4, Math.max(1, level)) as 1 | 2 | 3 | 4;
  return { kind: "studying", level: clamped };
}
