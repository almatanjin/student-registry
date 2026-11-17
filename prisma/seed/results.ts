import type { PrismaClient } from "@/generated/prisma/client";

/** Demo grades: assessment title → student → grade. */
const GRADES: Record<string, Record<string, number>> = {
  "Lab report 1": { "Alma Tanjin": 72, "Liam Chen": 55 },
  "Programming test": { "Alma Tanjin": 68, "Liam Chen": 38, "Priya Kabir": 45 },
  "Regression project": { "Sofia Rossi": 64, "Daniel Mensah": 81 },
};

/**
 * Demo release states. Alma's CS101 and Sofia's and Daniel's DS501 are published;
 * Liam's CS101 is withheld (for example, pending an academic misconduct review);
 * Priya's CS101 stays Pending because her lab report has no grade.
 */
const RESULTS: { student: string; moduleCode: string; state: "PUBLISHED" | "WITHHELD" }[] = [
  { student: "Alma Tanjin", moduleCode: "CS101", state: "PUBLISHED" },
  { student: "Liam Chen", moduleCode: "CS101", state: "WITHHELD" },
  { student: "Sofia Rossi", moduleCode: "DS501", state: "PUBLISHED" },
  { student: "Daniel Mensah", moduleCode: "DS501", state: "PUBLISHED" },
];

export async function seedResults(prisma: PrismaClient, options: { studentIds: Record<string, string> }) {
  const assessments = await prisma.assessment.findMany({ select: { id: true, title: true } });
  const assessmentIds = Object.fromEntries(assessments.map((row) => [row.title, row.id]));
  const modules = await prisma.module.findMany({ select: { id: true, code: true } });
  const moduleIds = Object.fromEntries(modules.map((row) => [row.code, row.id]));

  let grades = 0;
  for (const [title, byStudent] of Object.entries(GRADES)) {
    for (const [student, value] of Object.entries(byStudent)) {
      await prisma.grade.create({
        data: { assessmentId: assessmentIds[title], studentId: options.studentIds[student], value },
      });
      grades += 1;
    }
  }
  for (const result of RESULTS) {
    await prisma.moduleResult.create({
      data: { studentId: options.studentIds[result.student], moduleId: moduleIds[result.moduleCode], state: result.state },
    });
  }
  return grades;
}
