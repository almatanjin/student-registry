import type { PrismaClient } from "@/generated/prisma/client";
import { hashPassword } from "@/server/auth/password";
import { clearAllTables } from "@/server/maintenance";
import { removeSubmissionFiles, seedAssessments } from "./assessments";
import { seedPayments } from "./payments";
import { seedProgrammes } from "./programmes";
import { seedResults } from "./results";
import { seedStaff } from "./staff";
import { seedStudents } from "./students";

export type SeedOptions = {
  /** Today's date ("YYYY-MM-DD"); seeded due dates and deadlines are relative to it. */
  today: string;
  /** Password for every seeded account (SEED_USER_PASSWORD). */
  password: string;
  /** Time zone for assessment deadlines (APP_TIMEZONE); defaults to Europe/London. */
  timeZone?: string;
};

/**
 * Replaces all data with the demo data set.
 * Running it again gives the same result, so it is safe to run repeatedly.
 */
export async function runSeed(prisma: PrismaClient, options: SeedOptions) {
  if (options.password.length < 8) {
    throw new Error("SEED_USER_PASSWORD must be at least 8 characters long.");
  }
  const passwordHash = await hashPassword(options.password);

  await removeSubmissionFiles(prisma);
  await clearAllTables(prisma);
  const programmes = await seedProgrammes(prisma);
  const staff = await seedStaff(prisma, passwordHash);
  const programmeIds = Object.fromEntries(programmes.map((programme) => [programme.code, programme.id]));
  const students = await seedStudents(prisma, { today: options.today, passwordHash, programmeIds });
  const payments = await seedPayments(prisma, { today: options.today, students, recordedById: staff[0].id });
  const studentIds = Object.fromEntries(students.map((student) => [student.fullName, student.id]));
  const assessments = await seedAssessments(prisma, {
    today: options.today,
    timeZone: options.timeZone ?? "Europe/London",
    studentIds,
  });
  const grades = await seedResults(prisma, { studentIds });
  return { programmes, staff, students, payments, assessments, grades };
}
