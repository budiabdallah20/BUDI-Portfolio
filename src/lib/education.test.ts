import { describe, expect, it } from "vitest";
import { getAcademicStatus } from "./education";

describe("Intelligent Academic Level Engine", () => {
  it("calculates Level 1 for dates between Aug 2025 and July 2026", () => {
    const nov2025 = new Date("2025-11-15T12:00:00Z");
    const status = getAcademicStatus(nov2025);
    expect(status.kind).toBe("studying");
    expect(status.level).toBe(1);
    expect(status.levelPadded).toBe("01");
    expect(status.stages[0].status).toBe("current");
    expect(status.stages[1].status).toBe("upcoming");
    expect(status.academicYearEn).toContain("2025");
  });

  it("calculates Level 2 for November 2026 (current academic cycle)", () => {
    const nov2026 = new Date("2026-11-20T12:00:00Z");
    const status = getAcademicStatus(nov2026);
    expect(status.kind).toBe("studying");
    expect(status.level).toBe(2);
    expect(status.levelPadded).toBe("02");
    expect(status.stages[0].status).toBe("completed");
    expect(status.stages[1].status).toBe("current");
    expect(status.stages[2].status).toBe("upcoming");
    expect(status.stages[3].status).toBe("upcoming");
    expect(status.academicYearEn).toBe("August 2026 — July 2027");
  });

  it("calculates Level 3 for September 2027", () => {
    const sep2027 = new Date("2027-09-01T12:00:00Z");
    const status = getAcademicStatus(sep2027);
    expect(status.kind).toBe("studying");
    expect(status.level).toBe(3);
    expect(status.levelPadded).toBe("03");
    expect(status.stages[0].status).toBe("completed");
    expect(status.stages[1].status).toBe("completed");
    expect(status.stages[2].status).toBe("current");
    expect(status.stages[3].status).toBe("upcoming");
  });

  it("calculates Level 4 for January 2029", () => {
    const jan2029 = new Date("2029-01-15T12:00:00Z");
    const status = getAcademicStatus(jan2029);
    expect(status.kind).toBe("studying");
    expect(status.level).toBe(4);
    expect(status.stages[3].status).toBe("current");
  });

  it("does NOT auto-claim graduated after July 2029 without verification", () => {
    const aug2029 = new Date("2029-08-01T12:00:00Z");
    const status = getAcademicStatus(aug2029);
    expect(status.kind).toBe("completed_awaiting_confirmation");
    expect(status.isGraduated).toBe(false);
    expect(status.isCompleted).toBe(true);
  });

  it("only marks graduated when officially verified", () => {
    const aug2029 = new Date("2029-08-01T12:00:00Z");
    const status = getAcademicStatus({ now: aug2029, isGraduationOfficiallyVerified: true });
    expect(status.kind).toBe("graduated");
    expect(status.isGraduated).toBe(true);
  });

  it("respects manualOverrideLevel", () => {
    const nov2026 = new Date("2026-11-20T12:00:00Z");
    const status = getAcademicStatus({ now: nov2026, manualOverrideLevel: 3 });
    expect(status.level).toBe(3);
    expect(status.levelPadded).toBe("03");
  });
});
