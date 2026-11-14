import { readFileSync } from "node:fs";
import path from "node:path";
import type { PrismaClient } from "@/generated/prisma/client";
import { localDateTimeToUtc } from "@/domain/dates";
import { fileStorage } from "@/server/storage";

const DAY = 24 * 60 * 60 * 1000;

type SeedAssessment = {
  moduleCode: string;
  title: string;
  /** Days from the seed day; negative means the deadline has passed. Deadlines are at 17:00 local time. */
  deadlineInDays: number;
  isOpen: boolean;
  /** Who submitted, and how many days before (negative) or after (positive) the deadline. */
  submissions: { student: string; daysFromDeadline: number }[];
};

/** Demo assessments. Dates are relative to the day the seed runs, so the late and open cases always exist. */
export const SEED_ASSESSMENTS: SeedAssessment[] = [
  {
    moduleCode: "CS101",
    title: "Lab report 1",
    deadlineInDays: -21,
    isOpen: true,
    submissions: [
      { student: "Amara Okafor", daysFromDeadline: -2 },
      { student: "Liam Chen", daysFromDeadline: 1 },
    ],
  },
  {
    moduleCode: "CS101",
    title: "Programming test",
    deadlineInDays: -45,
    isOpen: false,
    submissions: [
      { student: "Amara Okafor", daysFromDeadline: -1 },
      { student: "Liam Chen", daysFromDeadline: -1 },
      { student: "Priya Patel", daysFromDeadline: -3 },
    ],
  },
  {
    moduleCode: "CS102",
    title: "Query optimisation report",
    deadlineInDays: 14,
    isOpen: true,
    submissions: [{ student: "Amara Okafor", daysFromDeadline: -15 }],
  },
  { moduleCode: "CS102", title: "Databases coursework", deadlineInDays: -7, isOpen: true, submissions: [] },
  { moduleCode: "CS102", title: "Normalisation exercise", deadlineInDays: 10, isOpen: true, submissions: [] },
  {
    moduleCode: "DS501",
    title: "Regression project",
    deadlineInDays: -30,
    isOpen: false,
    submissions: [
      { student: "Sofia Rossi", daysFromDeadline: -3 },
      { student: "Daniel Mensah", daysFromDeadline: -1 },
    ],
  },
  { moduleCode: "DS502", title: "Pipeline design", deadlineInDays: 21, isOpen: true, submissions: [] },
];

const SAMPLE_PDF = path.join(import.meta.dirname, "files", "sample-submission.pdf");

function deadlineFor(today: string, days: number, timeZone: string): Date {
  const date = new Date(Date.parse(`${today}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
  return localDateTimeToUtc(`${date}T17:00`, timeZone) as Date;
}

export async function seedAssessments(
  prisma: PrismaClient,
  options: { today: string; timeZone: string; studentIds: Record<string, string> },
) {
  const modules = await prisma.module.findMany({ select: { id: true, code: true } });
  const moduleIds = Object.fromEntries(modules.map((row) => [row.code, row.id]));
  const bytes = new Uint8Array(readFileSync(SAMPLE_PDF));
  const storage = fileStorage();

  const created = [];
  for (const seed of SEED_ASSESSMENTS) {
    const deadline = deadlineFor(options.today, seed.deadlineInDays, options.timeZone);
    const assessment = await prisma.assessment.create({
      data: { moduleId: moduleIds[seed.moduleCode], title: seed.title, deadline, isOpen: seed.isOpen },
    });
    for (const submission of seed.submissions) {
      const studentId = options.studentIds[submission.student];
      const firstName = submission.student.split(" ")[0].toLowerCase();
      await prisma.submission.create({
        data: {
          assessmentId: assessment.id,
          studentId,
          storageKey: await storage.put(bytes),
          originalName: `${firstName}-${seed.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`,
          mimeType: "application/pdf",
          sizeBytes: bytes.byteLength,
          submittedAt: new Date(deadline.getTime() + submission.daysFromDeadline * DAY),
        },
      });
    }
    created.push(assessment);
  }
  return created;
}

/** Removes the stored files of all current submissions, before the seed empties the tables. */
export async function removeSubmissionFiles(prisma: PrismaClient) {
  const exists = await prisma.$queryRaw<{ exists: boolean }[]>`SELECT to_regclass('public."Submission"') IS NOT NULL AS exists`;
  if (!exists[0]?.exists) return;
  const storage = fileStorage();
  for (const { storageKey } of await prisma.submission.findMany({ select: { storageKey: true } })) {
    await storage.remove(storageKey);
  }
}
