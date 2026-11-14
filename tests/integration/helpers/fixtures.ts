import { prisma } from "@/server/db";
import { hashPassword } from "@/server/auth/password";

let counter = 0;
const next = () => ++counter;

type PlanRow = { sequence: number; amountMinor: number; dueMonth: number; dueDay: number };

export async function createProgramme(
  overrides: { code?: string; name?: string; annualFeeMinor?: number; feePlan?: PlanRow[] } = {},
) {
  const n = next();
  const annualFeeMinor = overrides.annualFeeMinor ?? 900_000;
  return prisma.programme.create({
    data: {
      code: overrides.code ?? `PRG-${n}`,
      name: overrides.name ?? `Programme ${n}`,
      annualFeeMinor,
      feePlan: overrides.feePlan ? { create: overrides.feePlan } : undefined,
    },
  });
}

export async function createStaffAccount(email = `staff${next()}@sms.example`) {
  return prisma.user.create({ data: { email, passwordHash: await hashPassword("staff-password"), role: "STAFF" } });
}

/** A student record with its account, created directly in the database. */
export async function createStudentRecord(options: {
  programmeId: string;
  fullName?: string;
  email?: string;
  academicYearStart?: number;
  status?: "ENROLLED" | "DEFERRED" | "WITHDRAWN" | "COMPLETED";
  studentNumber?: string;
}) {
  const n = next();
  return prisma.student.create({
    data: {
      studentNumber: options.studentNumber ?? `SMS-1999-${String(n).padStart(4, "0")}`,
      fullName: options.fullName ?? `Student ${n}`,
      dateOfBirth: new Date("2004-05-06"),
      academicYearStart: options.academicYearStart ?? 2026,
      status: options.status ?? "ENROLLED",
      programme: { connect: { id: options.programmeId } },
      user: {
        create: {
          email: options.email ?? `student${n}@sms.example`,
          passwordHash: await hashPassword("student-password"),
          role: "STUDENT",
        },
      },
    },
  });
}

export async function recordPaymentDirectly(studentId: string, recordedById: string, amountMinor = 10_000) {
  return prisma.payment.create({
    data: { studentId, recordedById, amountMinor, paidOn: new Date("2026-10-01"), reference: `REF-${next()}` },
  });
}

export async function createModule(programmeId: string, overrides: { code?: string; title?: string } = {}) {
  const n = next();
  return prisma.module.create({
    data: { programmeId, code: overrides.code ?? `MOD-${n}`, title: overrides.title ?? `Module ${n}` },
  });
}

export async function createAssessment(
  moduleId: string,
  overrides: { title?: string; deadline?: Date; isOpen?: boolean } = {},
) {
  const n = next();
  return prisma.assessment.create({
    data: {
      moduleId,
      title: overrides.title ?? `Assessment ${n}`,
      deadline: overrides.deadline ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isOpen: overrides.isOpen ?? true,
    },
  });
}
