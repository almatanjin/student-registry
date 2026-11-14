import { Prisma } from "@/generated/prisma/client";
import { calculateBalance, type Balance, type BilledInstalment } from "@/domain/fees";
import { recordPaymentSchema } from "@/domain/schemas/payment";
import { money, today } from "@/server/config";
import { prisma } from "@/server/db";
import { ConflictError, NotFoundError } from "@/server/http/errors";
import { lockStudent } from "@/server/students/service";

type Tx = Prisma.TransactionClient;

export type PaymentView = { id: string; amountMinor: number; paidOn: string; reference: string; recordedAt: string };

export type FeesView = Balance & { payments: PaymentView[] };

const DUPLICATE_REFERENCE = "This reference number has already been recorded";

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

async function loadInstalments(tx: Tx, studentId: string): Promise<BilledInstalment[]> {
  const rows = await tx.studentInstalment.findMany({
    where: { studentId },
    select: { sequence: true, amountMinor: true, dueDate: true },
  });
  return rows.map((row) => ({ sequence: row.sequence, amountMinor: row.amountMinor, dueDate: isoDate(row.dueDate) }));
}

async function totalPaid(tx: Tx, studentId: string): Promise<number> {
  const result = await tx.payment.aggregate({ where: { studentId }, _sum: { amountMinor: true } });
  return result._sum.amountMinor ?? 0;
}

/** A student's bill, balance, and payment history, computed from the recorded data on every call. */
export async function getStudentFees(studentId: string, on: string = today()): Promise<FeesView> {
  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
  if (!student) throw new NotFoundError();

  const [instalments, payments] = await Promise.all([
    loadInstalments(prisma, studentId),
    prisma.payment.findMany({
      where: { studentId },
      orderBy: [{ paidOn: "desc" }, { createdAt: "desc" }],
      select: { id: true, amountMinor: true, paidOn: true, reference: true, createdAt: true },
    }),
  ]);
  const paidMinor = payments.reduce((sum, payment) => sum + payment.amountMinor, 0);

  return {
    ...calculateBalance(instalments, paidMinor, on),
    payments: payments.map((payment) => ({
      id: payment.id,
      amountMinor: payment.amountMinor,
      paidOn: isoDate(payment.paidOn),
      reference: payment.reference,
      recordedAt: payment.createdAt.toISOString(),
    })),
  };
}

/**
 * Records a payment. The student row is locked for the whole transaction, so two payments at
 * the same moment are checked one after the other and cannot together exceed the balance.
 */
export async function recordPayment(studentId: string, body: unknown, recordedById: string): Promise<PaymentView> {
  const input = recordPaymentSchema(today()).parse(body);

  try {
    const payment = await prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({ where: { id: studentId }, select: { id: true } });
      if (!student) throw new NotFoundError();
      await lockStudent(tx, studentId);

      const duplicate = await tx.payment.findFirst({
        where: { reference: { equals: input.reference, mode: "insensitive" } },
        select: { id: true },
      });
      if (duplicate) throw new ConflictError("duplicate_reference", DUPLICATE_REFERENCE, "reference");

      const instalments = await loadInstalments(tx, studentId);
      const outstandingMinor = instalments.reduce((sum, i) => sum + i.amountMinor, 0) - (await totalPaid(tx, studentId));
      if (input.amount > outstandingMinor) {
        throw new ConflictError(
          "overpayment",
          `This payment is more than the outstanding balance of ${money(outstandingMinor)}`,
          "amount",
        );
      }

      return tx.payment.create({
        data: {
          studentId,
          recordedById,
          amountMinor: input.amount,
          paidOn: new Date(`${input.paidOn}T00:00:00Z`),
          reference: input.reference,
        },
      });
    });
    return {
      id: payment.id,
      amountMinor: payment.amountMinor,
      paidOn: isoDate(payment.paidOn),
      reference: payment.reference,
      recordedAt: payment.createdAt.toISOString(),
    };
  } catch (error) {
    // Two payments with the same reference at the same moment: the unique index decides.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictError("duplicate_reference", DUPLICATE_REFERENCE, "reference");
    }
    throw error;
  }
}
