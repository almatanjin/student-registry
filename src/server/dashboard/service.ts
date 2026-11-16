import { missingGrades } from "@/domain/results";
import type { EnrolmentStatus } from "@/domain/schemas/student";
import { prisma } from "@/server/db";
import type { OverdueStudent } from "@/server/fees/overdue";

export type DashboardSummary = {
  /** Enrolled students, and the other statuses that have at least one student. */
  enrolled: { count: number; others: { status: EnrolmentStatus; count: number }[] };
  overdue: { count: number; totalMinor: number };
  /** All recorded payments against all billed instalments, as a whole percent rounded down. */
  fees: { paidMinor: number; billedMinor: number; percent: number };
  /** Module results that are Pending and complete, so "Publish all" would publish them. */
  resultsToPublish: number;
};

const OTHER_STATUSES: EnrolmentStatus[] = ["DEFERRED", "WITHDRAWN", "COMPLETED"];

/**
 * The figures for the staff dashboard cards, worked out from current records.
 * The overdue list is passed in because the dashboard already loads it for its table,
 * so the overdue rules live in one place and the data is read once.
 */
export async function getDashboardSummary(overdue: OverdueStudent[]): Promise<DashboardSummary> {
  const [byStatus, billed, paid, resultsToPublish] = await Promise.all([
    prisma.student.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.studentInstalment.aggregate({ _sum: { amountMinor: true } }),
    prisma.payment.aggregate({ _sum: { amountMinor: true } }),
    countResultsToPublish(),
  ]);
  const billedMinor = billed._sum.amountMinor ?? 0;
  const paidMinor = paid._sum.amountMinor ?? 0;
  const countOf = (status: EnrolmentStatus) => byStatus.find((row) => row.status === status)?._count._all ?? 0;

  return {
    enrolled: {
      count: countOf("ENROLLED"),
      others: OTHER_STATUSES.map((status) => ({ status, count: countOf(status) })).filter((row) => row.count > 0),
    },
    overdue: {
      count: overdue.length,
      totalMinor: overdue.reduce((sum, student) => sum + student.overdueMinor, 0),
    },
    // Rounded down, so the card never shows 100% while anything is still owed.
    fees: { paidMinor, billedMinor, percent: billedMinor === 0 ? 0 : Math.floor((paidMinor * 100) / billedMinor) },
    resultsToPublish,
  };
}

/**
 * Counts each student and module whose result is Pending (or has no row yet) and has a grade for
 * every assessment in the module, using the same completeness rule as publishing.
 */
async function countResultsToPublish(): Promise<number> {
  const [modules, students, grades, results] = await Promise.all([
    prisma.module.findMany({ select: { id: true, programmeId: true, assessments: { select: { id: true, title: true } } } }),
    prisma.student.findMany({ select: { id: true, programmeId: true } }),
    prisma.grade.findMany({ select: { studentId: true, assessmentId: true } }),
    prisma.moduleResult.findMany({ select: { studentId: true, moduleId: true, state: true } }),
  ]);
  const gradedBy = new Map<string, Set<string>>();
  for (const grade of grades) {
    const set = gradedBy.get(grade.studentId) ?? new Set<string>();
    set.add(grade.assessmentId);
    gradedBy.set(grade.studentId, set);
  }
  const stateOf = new Map(results.map((result) => [`${result.studentId}:${result.moduleId}`, result.state]));

  let count = 0;
  for (const module_ of modules) {
    for (const student of students) {
      if (student.programmeId !== module_.programmeId) continue;
      if ((stateOf.get(`${student.id}:${module_.id}`) ?? "PENDING") !== "PENDING") continue;
      const missing = missingGrades(module_.assessments, gradedBy.get(student.id) ?? new Set());
      if (missing !== null && missing.length === 0) count += 1;
    }
  }
  return count;
}
