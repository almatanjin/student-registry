import { readFileSync } from "node:fs";
import { beforeAll, expect, test } from "vitest";
import { verifyCredentials } from "@/server/auth/credentials";
import { prisma } from "@/server/db";
import { runSeed } from "../../../prisma/seed/index";
import { SEED_STUDENTS } from "../../../prisma/seed/students";

const PASSWORD = "seed-test-password";

beforeAll(async () => {
  await runSeed(prisma, { today: "2026-11-14", password: PASSWORD });
});

test("the seed creates at least 6 students across both programmes and all four statuses", async () => {
  const students = await prisma.student.findMany({ include: { programme: true } });

  expect(students.length).toBeGreaterThanOrEqual(6);
  expect(new Set(students.map((s) => s.programme.code))).toEqual(new Set(["BSC-CS", "MSC-DS"]));
  expect(new Set(students.map((s) => s.status))).toEqual(new Set(["ENROLLED", "DEFERRED", "WITHDRAWN", "COMPLETED"]));
});

test("seeded Student IDs follow the format and the per-year sequence", async () => {
  const students = await prisma.student.findMany({ orderBy: { studentNumber: "asc" } });

  for (const student of students) {
    expect(student.studentNumber).toMatch(new RegExp(`^SMS-${student.academicYearStart}-\\d{4}$`));
  }
  const byYear = Map.groupBy(students, (s) => s.academicYearStart);
  for (const group of byYear.values()) {
    expect(group.map((s) => Number(s.studentNumber.slice(-4)))).toEqual(group.map((_, i) => i + 1));
  }
});

test.each(SEED_STUDENTS.map((s) => s.email))("seeded student %s can sign in", async (email) => {
  expect(await verifyCredentials(email, PASSWORD)).toMatchObject({ email, role: "STUDENT", mustChangePassword: false });
});

test("the README lists every seeded student email", () => {
  const readme = readFileSync("README.md", "utf8");
  for (const { email } of SEED_STUDENTS) expect(readme).toContain(email);
});
