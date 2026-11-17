export type Classification = "Fail" | "Pass" | "Merit" | "Distinction";

export const RESULT_STATES = ["PENDING", "PUBLISHED", "WITHHELD"] as const;
export type ResultState = (typeof RESULT_STATES)[number];

export const RESULT_STATE_LABELS: Record<ResultState, string> = {
  PENDING: "Pending",
  PUBLISHED: "Published",
  WITHHELD: "Withheld",
};

/** Pass from 40, Merit from 60, Distinction from 70; below 40 is a Fail. */
export function classify(grade: number): Classification {
  if (grade >= 70) return "Distinction";
  if (grade >= 60) return "Merit";
  if (grade >= 40) return "Pass";
  return "Fail";
}

/** A whole number from 0 to 100, given as a number or as text; null for anything else. */
export function parseGrade(value: unknown): number | null {
  let grade: number;
  if (typeof value === "number") grade = value;
  else if (typeof value === "string" && /^\s*\d{1,3}\s*$/.test(value)) grade = Number(value);
  else return null;
  return Number.isInteger(grade) && grade >= 0 && grade <= 100 ? grade : null;
}

/**
 * Titles of the module's assessments the student has no grade for, in order.
 * An empty list means the results are complete; null means the module has no assessments to publish.
 */
export function missingGrades(assessments: { id: string; title: string }[], graded: Set<string>): string[] | null {
  if (assessments.length === 0) return null;
  return assessments.filter((assessment) => !graded.has(assessment.id)).map((assessment) => assessment.title);
}

/** How a module's students' results stand, as counted for the staff results overview. */
export type ModuleResultCounts = {
  /** Students on the module's programme. */
  students: number;
  /** Pending and complete, so "Publish all" would publish them. */
  ready: number;
  /** Pending and still missing at least one grade. */
  waiting: number;
  withheld: number;
  published: number;
};

export type ModuleResultStatus = { label: string; tone: "neutral" | "blue" | "purple" | "green" };

/** The one pill a module's results card shows: the first rule that applies, in the order below. */
export function moduleResultStatus(assessmentCount: number, counts: ModuleResultCounts): ModuleResultStatus {
  if (assessmentCount === 0) return { label: "No assessments yet", tone: "neutral" };
  if (counts.students === 0) return { label: "No students yet", tone: "neutral" };
  if (counts.ready > 0) return { label: `${counts.ready} ready to publish`, tone: "blue" };
  if (counts.waiting > 0) return { label: "Waiting for grades", tone: "neutral" };
  if (counts.withheld > 0) return { label: `${counts.withheld} withheld`, tone: "purple" };
  return { label: "All published", tone: "green" };
}
