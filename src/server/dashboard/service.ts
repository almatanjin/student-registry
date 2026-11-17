import type { EnrolmentStatus } from "@/domain/schemas/student";
import { prisma } from "@/server/db";
import type { OverdueStudent } from "@/server/fees/overdue";
import { listModuleResultSummaries } from "@/server/results/service";

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

/** Pending and complete module results across every module, counted the same way as the results overview cards. */
async function countResultsToPublish(): Promise<number> {
  const summaries = await listModuleResultSummaries();
  return summaries.reduce((sum, summary) => sum + summary.counts.ready, 0);
}
