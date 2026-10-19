/**
 * Certificate grading — pure, testable, shared by the /security page.
 *
 * `core: true` marks the checks that MUST pass for an A+; a failing core
 * check caps the grade no matter how many minor checks pass.
 */

export interface CheckOutcome {
  id: string;
  pass: boolean;
  core: boolean;
}

export interface Grade {
  /** 0–100, proportional to passed checks. */
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D";
  passed: number;
  total: number;
}

export function gradeOf(outcomes: readonly CheckOutcome[]): Grade {
  const total = outcomes.length;
  const passed = outcomes.filter((o) => o.pass).length;
  const score = total === 0 ? 0 : Math.round((passed / total) * 100);
  const coreFailed = outcomes.some((o) => o.core && !o.pass);

  let grade: Grade["grade"];
  if (score === 100 && !coreFailed) grade = "A+";
  else if (coreFailed) grade = score >= 75 ? "B" : score >= 50 ? "C" : "D";
  else if (score >= 90) grade = "A";
  else if (score >= 75) grade = "B";
  else if (score >= 50) grade = "C";
  else grade = "D";

  return { score, grade, passed, total };
}
