import type { PrismaClient } from "@/generated/prisma/client";
import { academicYearOf } from "@/domain/academic-year";
import type { EnrolmentStatus } from "@/domain/schemas/student";
import { datePlanInstalments } from "@/domain/fees";
import { billStudent } from "@/server/fees/billing";
import { PROGRAMMES } from "./programmes";
import { nextStudentNumber } from "@/server/students/service";

type SeedStudent = {
  fullName: string;
  email: string;
  dateOfBirth: string;
  programmeCode: "BSC-CS" | "MSC-DS";
  /**
   * Academic year relative to the day the seed runs. "current-or-next" uses the current year
   * unless all of its instalments are already due, so the student can be part-paid without being overdue.
   */
  intake: "current" | "previous" | "current-or-next";
  status: EnrolmentStatus;
};

/** Demo students. Their password is SEED_USER_PASSWORD from .env. */
export const SEED_STUDENTS = [
  { fullName: "Alma Tanjin", email: "alma@students.sms.example", dateOfBirth: "2006-02-11", programmeCode: "BSC-CS", intake: "current", status: "ENROLLED" },
  { fullName: "Liam Chen", email: "liam.chen@students.sms.example", dateOfBirth: "2005-09-23", programmeCode: "BSC-CS", intake: "current-or-next", status: "ENROLLED" },
  { fullName: "Priya Kabir", email: "priya.k@students.sms.example", dateOfBirth: "2006-06-02", programmeCode: "BSC-CS", intake: "current", status: "ENROLLED" },
  { fullName: "Fatima Hassan", email: "fatima.hassan@students.sms.example", dateOfBirth: "2004-12-30", programmeCode: "BSC-CS", intake: "previous", status: "WITHDRAWN" },
  { fullName: "Sofia Rossi", email: "sofia.rossi@students.sms.example", dateOfBirth: "2000-04-17", programmeCode: "MSC-DS", intake: "previous", status: "ENROLLED" },
  { fullName: "Daniel Mensah", email: "daniel.mensah@students.sms.example", dateOfBirth: "1999-07-08", programmeCode: "MSC-DS", intake: "previous", status: "COMPLETED" },
  { fullName: "Noah Williams", email: "noah.williams@students.sms.example", dateOfBirth: "2001-01-26", programmeCode: "MSC-DS", intake: "current", status: "DEFERRED" },
] as const satisfies readonly SeedStudent[];

export async function seedStudents(
  prisma: PrismaClient,
  options: { today: string; passwordHash: string; programmeIds: Record<string, string> },
) {
  const currentYear = academicYearOf(options.today);
  const created = [];
  for (const student of SEED_STUDENTS) {
    const academicYearStart = intakeYear(student, currentYear, options.today);
    const programmeId = options.programmeIds[student.programmeCode];
    created.push(
      await prisma.$transaction(async (tx) => {
        const row = await tx.student.create({
          data: {
            studentNumber: await nextStudentNumber(tx, academicYearStart),
            fullName: student.fullName,
            dateOfBirth: new Date(`${student.dateOfBirth}T00:00:00Z`),
            academicYearStart,
            status: student.status,
            programme: { connect: { id: programmeId } },
            user: { create: { email: student.email, passwordHash: options.passwordHash, role: "STUDENT" } },
          },
        });
        await billStudent(tx, { id: row.id, programmeId, academicYearStart });
        return row;
      }),
    );
  }
  return created;
}

function intakeYear(student: SeedStudent, currentYear: number, today: string): number {
  if (student.intake === "previous") return currentYear - 1;
  if (student.intake === "current") return currentYear;
  const plan = PROGRAMMES.find((programme) => programme.code === student.programmeCode)?.feePlan ?? [];
  const allDue = datePlanInstalments([...plan], currentYear).every((instalment) => instalment.dueDate < today);
  return allDue ? currentYear + 1 : currentYear;
}
