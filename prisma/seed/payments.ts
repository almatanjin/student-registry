import type { PrismaClient } from "@/generated/prisma/client";
import { calculateBalance } from "@/domain/fees";

type SeededStudent = { id: string; fullName: string; studentNumber: string; academicYearStart: number };

/**
 * Demo payments that give the same picture whatever day the seed runs:
 * Amara and Daniel are fully paid, Liam is part-paid but not overdue,
 * Fatima and Sofia (previous academic year, so every instalment is due) are overdue,
 * and Priya and Noah have paid nothing yet.
 */
export async function seedPayments(
  prisma: PrismaClient,
  options: { today: string; students: SeededStudent[]; recordedById: string },
) {
  const byName = new Map(options.students.map((student) => [student.fullName, student]));
  const student = (name: string) => {
    const found = byName.get(name);
    if (!found) throw new Error(`Seed student ${name} is missing.`);
    return found;
  };

  const payments: { student: SeededStudent; amountMinor: number; paidOn: string }[] = [];

  const amara = student("Amara Okafor");
  payments.push({ student: amara, amountMinor: 450_000, paidOn: options.today });
  payments.push({ student: amara, amountMinor: 450_000, paidOn: options.today });

  // Liam pays exactly what has fallen due so far, or the first instalment ahead of time when nothing is due yet.
  const liam = student("Liam Chen");
  const liamBill = await billedInstalments(prisma, liam.id);
  const dueSoFar = calculateBalance(liamBill, 0, options.today).dueToDateMinor;
  payments.push({ student: liam, amountMinor: dueSoFar > 0 ? dueSoFar : liamBill[0].amountMinor, paidOn: options.today });

  const fatima = student("Fatima Hassan");
  payments.push({ student: fatima, amountMinor: 300_000, paidOn: `${fatima.academicYearStart}-10-01` });

  const sofia = student("Sofia Rossi");
  payments.push({ student: sofia, amountMinor: 600_000, paidOn: `${sofia.academicYearStart}-10-01` });

  const daniel = student("Daniel Mensah");
  payments.push({ student: daniel, amountMinor: 600_000, paidOn: `${daniel.academicYearStart}-10-01` });
  payments.push({ student: daniel, amountMinor: 600_000, paidOn: `${daniel.academicYearStart + 1}-02-01` });

  let count = 0;
  for (const payment of payments) {
    count += 1;
    await prisma.payment.create({
      data: {
        studentId: payment.student.id,
        recordedById: options.recordedById,
        amountMinor: payment.amountMinor,
        paidOn: new Date(`${payment.paidOn}T00:00:00Z`),
        reference: `BANK-${payment.student.studentNumber.slice(4)}-${String(count).padStart(2, "0")}`,
      },
    });
  }
  return count;
}

async function billedInstalments(prisma: PrismaClient, studentId: string) {
  const rows = await prisma.studentInstalment.findMany({ where: { studentId }, orderBy: { dueDate: "asc" } });
  return rows.map((row) => ({ sequence: row.sequence, amountMinor: row.amountMinor, dueDate: row.dueDate.toISOString().slice(0, 10) }));
}
