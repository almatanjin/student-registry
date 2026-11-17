import { existsSync } from "node:fs";
import path from "node:path";
import { beforeAll, expect, test } from "vitest";
import { getAssessmentRoster } from "@/server/assessments/service";
import { prisma } from "@/server/db";
import { runSeed } from "../../../prisma/seed/index";

const TODAY = "2026-11-14";

async function rosterOf(title: string) {
  const assessment = await prisma.assessment.findFirstOrThrow({ where: { title } });
  const { assessment: view, rows } = await getAssessmentRoster(assessment.id);
  const states = Object.fromEntries(rows.map((row) => [row.student.fullName, row.submission?.state ?? "missing"]));
  return { view, states };
}

beforeAll(async () => {
  await runSeed(prisma, { today: TODAY, password: "seed-test-password" });
});

test("the past-deadline lab report has on-time, late, and missing submissions", async () => {
  const { view, states } = await rosterOf("Lab report 1");

  expect(new Date(view.deadline).getTime()).toBeLessThan(Date.parse(`${TODAY}T00:00:00Z`));
  expect(states).toMatchObject({ "Alma Tanjin": "on-time", "Liam Chen": "late", "Priya Kabir": "missing" });
});

test("an open assessment whose deadline has passed is available for late submissions", async () => {
  const { view, states } = await rosterOf("Databases coursework");

  expect(view.isOpen).toBe(true);
  expect(new Date(view.deadline).getTime()).toBeLessThan(Date.parse(`${TODAY}T00:00:00Z`));
  expect(Object.values(states).every((state) => state === "missing")).toBe(true);
});

test("an open assessment with a future deadline and no submissions exists for each programme", async () => {
  for (const title of ["Normalisation exercise", "Pipeline design"]) {
    const { view, states } = await rosterOf(title);

    expect(view.isOpen).toBe(true);
    expect(new Date(view.deadline).getTime()).toBeGreaterThan(Date.parse(`${TODAY}T23:59:59Z`));
    expect(Object.values(states).every((state) => state === "missing")).toBe(true);
  }
});

test("a closed assessment shows its on-time submissions", async () => {
  const { view, states } = await rosterOf("Regression project");

  expect(view.isOpen).toBe(false);
  expect(states).toMatchObject({ "Sofia Rossi": "on-time", "Daniel Mensah": "on-time", "Noah Williams": "missing" });
});

test("every seeded submission has a stored file", async () => {
  const submissions = await prisma.submission.findMany();

  expect(submissions.length).toBeGreaterThanOrEqual(5);
  for (const submission of submissions) {
    expect(existsSync(path.join(process.env.UPLOAD_DIR ?? "", submission.storageKey))).toBe(true);
    expect(submission.mimeType).toBe("application/pdf");
  }
});
