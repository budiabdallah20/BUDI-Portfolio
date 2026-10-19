import { describe, expect, it } from "vitest";
import { gradeOf, type CheckOutcome } from "./score";

/** 13 checks where index 0 is the (single) core check — mirrors the page. */
function checks(passing: number, total = 13): CheckOutcome[] {
  return Array.from({ length: total }, (_, i) => ({
    id: `c${i}`,
    pass: i < passing,
    core: i === 0,
  }));
}

describe("gradeOf", () => {
  it("gives A+ 100/100 when everything passes", () => {
    expect(gradeOf(checks(13))).toEqual({ score: 100, grade: "A+", passed: 13, total: 13 });
  });

  it("caps at B when a core check fails even if almost everything else passes", () => {
    const coreFailed = checks(13).map((c) => (c.core ? { ...c, pass: false } : c)); // 12/13, core red
    const result = gradeOf(coreFailed);
    expect(result.passed).toBe(12);
    expect(result.score).toBe(92);
    expect(result.grade).toBe("B");
  });

  it("plain A (not A+) when a non-core check fails", () => {
    const minorFailed = checks(13).map((c, i) => (i === 12 ? { ...c, pass: false } : c)); // 12/13, no core fail
    const result = gradeOf(minorFailed);
    expect(result.grade).toBe("A");
    expect(result.score).toBe(92);
  });

  it("degrades to C/D on heavier failure", () => {
    expect(gradeOf(checks(5)).grade).toBe("D"); // 38
    expect(gradeOf(checks(9)).grade).toBe("C"); // 69
    expect(gradeOf(checks(12)).score).toBeGreaterThanOrEqual(90); // 92 → A
  });

  it("handles the empty list safely", () => {
    expect(gradeOf([])).toEqual({ score: 0, grade: "D", passed: 0, total: 0 });
  });
});
