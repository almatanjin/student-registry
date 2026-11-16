import type { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { formatAcademicYear } from "@/domain/academic-year";
import {
  createStudentSchema,
  studentListQuerySchema,
  updateStudentSchema,
  type EnrolmentStatus,
} from "@/domain/schemas/student";
import { resetPasswordSchema } from "@/domain/schemas/password";
import { formatStudentNumber } from "@/domain/student-number";
import { hashPassword } from "@/server/auth/password";
import { billStudent } from "@/server/fees/billing";
import { today } from "@/server/config";
import { prisma } from "@/server/db";
import { ConflictError, NotFoundError, ValidationError, fieldErrorsFromZod } from "@/server/http/errors";

type Tx = Prisma.TransactionClient;

export type StudentView = {
  id: string;
  studentNumber: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  academicYearStart: number;
  academicYear: string;
  status: EnrolmentStatus;
  programme: { id: string; code: string; name: string };
};

const studentSelect = {
  id: true,
  studentNumber: true,
  fullName: true,
  dateOfBirth: true,
  academicYearStart: true,
  status: true,
  user: { select: { email: true } },
  programme: { select: { id: true, code: true, name: true } },
} satisfies Prisma.StudentSelect;

type StudentRow = Prisma.StudentGetPayload<{ select: typeof studentSelect }>;

/** The only shape student records leave the server in; it never includes password data. */
function toView(row: StudentRow): StudentView {
  return {
    id: row.id,
    studentNumber: row.studentNumber,
    fullName: row.fullName,
    email: row.user.email,
    dateOfBirth: row.dateOfBirth.toISOString().slice(0, 10),
    academicYearStart: row.academicYearStart,
    academicYear: formatAcademicYear(row.academicYearStart),
    status: row.status,
    programme: row.programme,
  };
}

const DUPLICATE_EMAIL = "This email is already in use";

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function assertEmailFree(tx: Tx, email: string, exceptUserId?: string) {
  const existing = await tx.user.findUnique({ where: { email }, select: { id: true } });
  if (existing && existing.id !== exceptUserId) throw new ConflictError("duplicate_email", DUPLICATE_EMAIL, "email");
}

async function isEmailTaken(email: string, exceptUserId?: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return existing !== null && existing.id !== exceptUserId;
}

/**
 * Validates a create or edit body. When other fields are invalid, a taken email is still reported
 * on the email field, so staff see every problem in one go instead of fixing the form twice.
 */
async function parseStudentBody<T>(
  schema: { safeParse(body: unknown): { success: true; data: T } | { success: false; error: ZodError } },
  body: unknown,
  ownerUserId?: () => Promise<string | undefined>,
): Promise<T> {
  const parsed = schema.safeParse(body);
  if (parsed.success) return parsed.data;

  const fields = fieldErrorsFromZod(parsed.error);
  const rawEmail = typeof body === "object" && body !== null ? (body as { email?: unknown }).email : undefined;
  if (!fields.email && rawEmail !== undefined) {
    const email = createStudentSchema(today()).shape.email.safeParse(rawEmail);
    if (email.success && (await isEmailTaken(email.data, await ownerUserId?.()))) fields.email = DUPLICATE_EMAIL;
  }
  throw new ValidationError(fields);
}

async function assertProgrammeExists(tx: Tx, programmeId: string) {
  const programme = await tx.programme.findUnique({ where: { id: programmeId }, select: { id: true } });
  if (!programme) throw new ValidationError({ programmeId: "Choose a programme" });
}

/** Locks one student row until the transaction ends; used by edits that affect billing and by payments. */
export async function lockStudent(tx: Tx, id: string) {
  await tx.$queryRaw`SELECT id FROM "Student" WHERE id = ${id} FOR UPDATE`;
}

/** Claims the next Student ID number for the year; the row lock serialises concurrent creations. */
export async function nextStudentNumber(tx: Tx, academicYearStart: number): Promise<string> {
  const [row] = await tx.$queryRaw<{ lastValue: number }[]>`
    INSERT INTO "StudentNumberCounter" ("year", "lastValue") VALUES (${academicYearStart}, 1)
    ON CONFLICT ("year") DO UPDATE SET "lastValue" = "StudentNumberCounter"."lastValue" + 1
    RETURNING "lastValue"`;
  return formatStudentNumber(academicYearStart, row.lastValue);
}

export async function createStudent(body: unknown): Promise<StudentView> {
  const input = await parseStudentBody(createStudentSchema(today()), body);
  const passwordHash = await hashPassword(input.initialPassword);

  try {
    const row = await prisma.$transaction(async (tx) => {
      await assertProgrammeExists(tx, input.programmeId);
      await assertEmailFree(tx, input.email);
      const studentNumber = await nextStudentNumber(tx, input.academicYear);
      const created = await tx.student.create({
        data: {
          studentNumber,
          fullName: input.fullName,
          dateOfBirth: new Date(`${input.dateOfBirth}T00:00:00Z`),
          academicYearStart: input.academicYear,
          status: input.status,
          programme: { connect: { id: input.programmeId } },
          // Staff chose this password, so the student must replace it at first sign-in.
          user: { create: { email: input.email, passwordHash, role: "STUDENT", mustChangePassword: true } },
        },
        select: studentSelect,
      });
      await billStudent(tx, {
        id: created.id,
        programmeId: input.programmeId,
        academicYearStart: input.academicYear,
      });
      return created;
    });
    return toView(row);
  } catch (error) {
    // Two creations with the same email at the same moment: the unique index decides.
    if (isUniqueViolation(error)) throw new ConflictError("duplicate_email", DUPLICATE_EMAIL, "email");
    throw error;
  }
}

export async function updateStudent(id: string, body: unknown): Promise<StudentView> {
  const input = await parseStudentBody(updateStudentSchema(today()), body, async () => {
    const student = await prisma.student.findUnique({ where: { id }, select: { userId: true } });
    return student?.userId;
  });

  try {
    const row = await prisma.$transaction(async (tx) => {
      // Same lock as payment recording, so a payment cannot slip in between the check and the re-bill.
      await lockStudent(tx, id);
      const current = await tx.student.findUnique({
        where: { id },
        select: { userId: true, programmeId: true, academicYearStart: true, _count: { select: { payments: true } } },
      });
      if (!current) throw new NotFoundError();

      const programmeChanges = input.programmeId !== undefined && input.programmeId !== current.programmeId;
      const yearChanges = input.academicYear !== undefined && input.academicYear !== current.academicYearStart;
      if ((programmeChanges || yearChanges) && current._count.payments > 0) {
        throw new ConflictError(
          "billing_locked",
          "The programme and academic year cannot change once a payment has been recorded for this student",
          programmeChanges ? "programmeId" : "academicYear",
        );
      }
      if (programmeChanges) await assertProgrammeExists(tx, input.programmeId as string);
      if (input.email !== undefined) await assertEmailFree(tx, input.email, current.userId);

      const updated = await tx.student.update({
        where: { id },
        data: {
          fullName: input.fullName,
          dateOfBirth: input.dateOfBirth ? new Date(`${input.dateOfBirth}T00:00:00Z`) : undefined,
          academicYearStart: input.academicYear,
          status: input.status,
          programme: programmeChanges ? { connect: { id: input.programmeId } } : undefined,
          user: input.email !== undefined ? { update: { email: input.email } } : undefined,
        },
        select: studentSelect,
      });
      if (programmeChanges || yearChanges) {
        await billStudent(tx, {
          id,
          programmeId: updated.programme.id,
          academicYearStart: updated.academicYearStart,
        });
      }
      return updated;
    });
    return toView(row);
  } catch (error) {
    if (isUniqueViolation(error)) throw new ConflictError("duplicate_email", DUPLICATE_EMAIL, "email");
    throw error;
  }
}

/**
 * Sets a temporary password chosen by staff. The student must replace it at their next sign-in,
 * and any session they already have stops working.
 */
export async function resetStudentPassword(id: string, body: unknown): Promise<void> {
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError(fieldErrorsFromZod(parsed.error));
  const student = await prisma.student.findUnique({ where: { id }, select: { userId: true } });
  if (!student) throw new NotFoundError();

  await prisma.user.update({
    where: { id: student.userId },
    data: {
      passwordHash: await hashPassword(parsed.data.temporaryPassword),
      mustChangePassword: true,
      passwordVersion: { increment: 1 },
    },
  });
}

export async function getStudent(id: string): Promise<StudentView> {
  const row = await prisma.student.findUnique({ where: { id }, select: studentSelect });
  if (!row) throw new NotFoundError();
  return toView(row);
}

export async function listStudents(query: unknown): Promise<StudentView[]> {
  const { q, programmeId, status } = studentListQuerySchema.parse(query);
  const rows = await prisma.student.findMany({
    where: {
      programmeId,
      status,
      OR: q
        ? [
            { fullName: { contains: q, mode: "insensitive" } },
            { studentNumber: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: { studentNumber: "asc" },
    select: studentSelect,
  });
  return rows.map(toView);
}

/** True once any payment exists, which locks the programme and academic year. */
export async function studentHasPayments(id: string): Promise<boolean> {
  return (await prisma.payment.count({ where: { studentId: id } })) > 0;
}
