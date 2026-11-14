import type { Prisma } from "@/generated/prisma/client";
import { datePlanInstalments } from "@/domain/fees";

/**
 * Bills a student from their programme's fee plan for one academic year, replacing any earlier bill.
 * Runs inside the caller's transaction; callers make sure no payment exists yet.
 */
export async function billStudent(
  tx: Prisma.TransactionClient,
  student: { id: string; programmeId: string; academicYearStart: number },
) {
  const plan = await tx.feePlanInstalment.findMany({
    where: { programmeId: student.programmeId },
    select: { sequence: true, amountMinor: true, dueMonth: true, dueDay: true },
  });
  await tx.studentInstalment.deleteMany({ where: { studentId: student.id } });
  await tx.studentInstalment.createMany({
    data: datePlanInstalments(plan, student.academicYearStart).map((instalment) => ({
      studentId: student.id,
      sequence: instalment.sequence,
      amountMinor: instalment.amountMinor,
      dueDate: new Date(`${instalment.dueDate}T00:00:00Z`),
    })),
  });
}
