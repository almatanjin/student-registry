import type { IsoDate } from "@/domain/dates";
import { calculateBalance } from "@/domain/fees";
import type { EnrolmentStatus } from "@/domain/schemas/student";
import { today } from "@/server/config";
import { prisma } from "@/server/db";

export type OverdueStudent = {
  id: string;
  studentNumber: string;
  fullName: string;
  programmeName: string;
  status: EnrolmentStatus;
  overdueMinor: number;
  earliestUnpaidDueDate: IsoDate;
};

/**
 * Every student with an overdue amount on `on`, whatever their enrolment status.
 * Highest overdue amount first; equal amounts show the longest-overdue student first.
 * Loads all students' instalments and payment totals in two queries and computes balances in memory.
 */
export async function listOverdueStudents(on: IsoDate = today()): Promise<OverdueStudent[]> {
  const [students, paidByStudent] = await Promise.all([
    prisma.student.findMany({
      select: {
        id: true,
        studentNumber: true,
        fullName: true,
        status: true,
        programme: { select: { name: true } },
        instalments: { select: { sequence: true, amountMinor: true, dueDate: true } },
      },
    }),
    prisma.payment.groupBy({ by: ["studentId"], _sum: { amountMinor: true } }),
  ]);
  const paid = new Map(paidByStudent.map((row) => [row.studentId, row._sum.amountMinor ?? 0]));

  const overdue: OverdueStudent[] = [];
  for (const student of students) {
    const instalments = student.instalments.map((row) => ({
      sequence: row.sequence,
      amountMinor: row.amountMinor,
      dueDate: row.dueDate.toISOString().slice(0, 10),
    }));
    const balance = calculateBalance(instalments, paid.get(student.id) ?? 0, on);
    if (balance.overdueMinor > 0 && balance.earliestUnpaidDueDate) {
      overdue.push({
        id: student.id,
        studentNumber: student.studentNumber,
        fullName: student.fullName,
        programmeName: student.programme.name,
        status: student.status,
        overdueMinor: balance.overdueMinor,
        earliestUnpaidDueDate: balance.earliestUnpaidDueDate,
      });
    }
  }
  return overdue.sort(
    (a, b) =>
      b.overdueMinor - a.overdueMinor ||
      a.earliestUnpaidDueDate.localeCompare(b.earliestUnpaidDueDate) ||
      a.fullName.localeCompare(b.fullName),
  );
}
