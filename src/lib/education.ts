/**
 * Intelligent Academic Level Engine — Africa/Cairo Timezone Aware
 *
 * Official Academic Schedule:
 * - Level 1: August 2025 – July 2026
 * - Level 2: August 2026 – July 2027
 * - Level 3: August 2027 – July 2028
 * - Level 4: August 2028 – July 2029
 * - After July 2029: Studies completed / graduation status awaiting confirmation
 *   (Never claim official graduation without explicit verification).
 */

export type AcademicLevel = 1 | 2 | 3 | 4;

export type AcademicStageStatus = "completed" | "current" | "upcoming";

export interface AcademicStage {
  level: AcademicLevel;
  levelNumber: string; // "01", "02", "03", "04"
  labelEn: string;
  labelFr: string;
  period: string; // "2025 — 2026"
  periodDetailedEn: string; // "August 2025 — July 2026"
  periodDetailedFr: string; // "Août 2025 — Juillet 2026"
  status: AcademicStageStatus;
}

export interface AcademicStatusBase {
  level: AcademicLevel;
  levelPadded: string; // "02"
  levelTotal: string; // "04"
  stages: AcademicStage[];
  academicYearEn: string; // "August 2026 — July 2027"
  academicYearFr: string; // "Août 2026 — Juillet 2027"
  progressPercent: number; // 0 to 100 within active year
  nextTransitionEn: string;
  nextTransitionFr: string;
}

export type AcademicStatus =
  | (AcademicStatusBase & {
      kind: "studying";
      isCompleted: false;
      isGraduated: false;
    })
  | (AcademicStatusBase & {
      kind: "completed_awaiting_confirmation";
      isCompleted: true;
      isGraduated: false;
      statusNoteEn: string;
      statusNoteFr: string;
    })
  | (AcademicStatusBase & {
      kind: "graduated";
      isCompleted: true;
      isGraduated: true;
      graduatedYear: number;
    });

export interface AcademicOptions {
  now?: Date;
  timeZone?: string;
  manualOverrideLevel?: AcademicLevel;
  manualOverrideStatus?: "studying" | "completed_awaiting_confirmation" | "graduated";
  isGraduationOfficiallyVerified?: boolean;
}

const START_YEAR = 2025;
const ROLLOVER_MONTH = 7; // August (0-indexed: 7 = August)
const FINAL_YEAR = 2029;
const DEFAULT_TIMEZONE = "Africa/Cairo";

const LEVEL_YEAR_NAMES = [
  { en: "First Level", fr: "Niveau Un", start: 2025, end: 2026 },
  { en: "Second Level", fr: "Niveau Deux", start: 2026, end: 2027 },
  { en: "Third Level", fr: "Niveau Trois", start: 2027, end: 2028 },
  { en: "Fourth Level", fr: "Niveau Quatre", start: 2028, end: 2029 },
] as const;

/**
 * Get the current year, month, and day in the Africa/Cairo timezone.
 */
function getCairoDateParts(date: Date, timeZone: string = DEFAULT_TIMEZONE): { year: number; month: number; day: number } {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const parts = formatter.formatToParts(date);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    for (const part of parts) {
      if (part.type === "year") year = Number.parseInt(part.value, 10);
      if (part.type === "month") month = Number.parseInt(part.value, 10);
      if (part.type === "day") day = Number.parseInt(part.value, 10);
    }
    return { year, month: month - 1, day }; // month is 0-indexed
  } catch {
    return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() };
  }
}

/**
 * Calculates academic standing derived from Africa/Cairo calendar date.
 */
export function getAcademicStatus(options?: AcademicOptions | Date): AcademicStatus {
  const opts: AcademicOptions = options instanceof Date ? { now: options } : options ?? {};
  const now = opts.now ?? new Date();
  const timeZone = opts.timeZone ?? DEFAULT_TIMEZONE;
  const isVerifiedGrad = opts.isGraduationOfficiallyVerified ?? false;

  const { year: cairoYear, month: cairoMonth } = getCairoDateParts(now, timeZone);

  // Manual status overrides if configured
  if (opts.manualOverrideStatus === "graduated" && isVerifiedGrad) {
    const stages = buildStages(4, true);
    return {
      kind: "graduated",
      level: 4,
      levelPadded: "04",
      levelTotal: "04",
      isCompleted: true,
      isGraduated: true,
      graduatedYear: cairoYear,
      stages,
      academicYearEn: "Completed",
      academicYearFr: "Terminé",
      progressPercent: 100,
      nextTransitionEn: "Degree Conferred",
      nextTransitionFr: "Diplôme Obtenu",
    };
  }

  // After July 2029 check:
  // August 1, 2029 or later
  const isPostFinalPeriod = cairoYear > FINAL_YEAR || (cairoYear === FINAL_YEAR && cairoMonth >= ROLLOVER_MONTH);

  if (isPostFinalPeriod) {
    const stages = buildStages(4, isVerifiedGrad);
    if (isVerifiedGrad) {
      return {
        kind: "graduated",
        level: 4,
        levelPadded: "04",
        levelTotal: "04",
        isCompleted: true,
        isGraduated: true,
        graduatedYear: cairoYear,
        stages,
        academicYearEn: "Graduated",
        academicYearFr: "Diplômé",
        progressPercent: 100,
        nextTransitionEn: "Degree Conferred",
        nextTransitionFr: "Diplôme Obtenu",
      };
    }
    return {
      kind: "completed_awaiting_confirmation",
      level: 4,
      levelPadded: "04",
      levelTotal: "04",
      isCompleted: true,
      isGraduated: false,
      statusNoteEn: "Studies Completed · Official Graduation Awaiting Confirmation",
      statusNoteFr: "Études terminées · En attente de confirmation du diplôme",
      stages,
      academicYearEn: "Final Term Completed",
      academicYearFr: "Dernier cycle terminé",
      progressPercent: 100,
      nextTransitionEn: "Graduation Review Pending",
      nextTransitionFr: "Examen de diplôme en cours",
    };
  }

  // Calculate academic year and level
  let calculatedLevel = cairoYear - START_YEAR + (cairoMonth >= ROLLOVER_MONTH ? 1 : 0);
  if (opts.manualOverrideLevel) {
    calculatedLevel = opts.manualOverrideLevel;
  }
  const level = Math.min(4, Math.max(1, calculatedLevel)) as AcademicLevel;

  const currentLevelInfo = LEVEL_YEAR_NAMES[level - 1];
  const academicYearEn = `August ${currentLevelInfo.start} — July ${currentLevelInfo.end}`;
  const academicYearFr = `Août ${currentLevelInfo.start} — Juillet ${currentLevelInfo.end}`;

  // Calculate progress percentage inside current academic year
  // Current academic year runs from August 1 (start year) to August 1 (end year)
  const academicYearStart = new Date(Date.UTC(currentLevelInfo.start, ROLLOVER_MONTH, 1)).getTime();
  const academicYearEnd = new Date(Date.UTC(currentLevelInfo.end, ROLLOVER_MONTH, 1)).getTime();
  const currentUtc = now.getTime();
  const clampedProgress = Math.min(100, Math.max(0, Math.round(((currentUtc - academicYearStart) / (academicYearEnd - academicYearStart)) * 100)));

  // Next transition
  const nextLevel = level < 4 ? level + 1 : null;
  const nextTransitionEn = nextLevel
    ? `Level 0${nextLevel} Transition: August ${currentLevelInfo.end}`
    : `Academic Completion: July ${FINAL_YEAR}`;
  const nextTransitionFr = nextLevel
    ? `Transition Niveau 0${nextLevel} : Août ${currentLevelInfo.end}`
    : `Fin des études : Juillet ${FINAL_YEAR}`;

  const stages = buildStages(level, false);

  return {
    kind: "studying",
    level,
    levelPadded: String(level).padStart(2, "0"),
    levelTotal: "04",
    isCompleted: false,
    isGraduated: false,
    stages,
    academicYearEn,
    academicYearFr,
    progressPercent: clampedProgress,
    nextTransitionEn,
    nextTransitionFr,
  };
}

function buildStages(currentLevel: AcademicLevel, allCompleted: boolean): AcademicStage[] {
  return LEVEL_YEAR_NAMES.map((info, idx) => {
    const stageLevel = (idx + 1) as AcademicLevel;
    let status: AcademicStageStatus = "upcoming";
    if (allCompleted || stageLevel < currentLevel) {
      status = "completed";
    } else if (stageLevel === currentLevel) {
      status = "current";
    }
    return {
      level: stageLevel,
      levelNumber: String(stageLevel).padStart(2, "0"),
      labelEn: info.en,
      labelFr: info.fr,
      period: `${info.start} — ${info.end}`,
      periodDetailedEn: `August ${info.start} — July ${info.end}`,
      periodDetailedFr: `Août ${info.start} — Juillet ${info.end}`,
      status,
    };
  });
}
