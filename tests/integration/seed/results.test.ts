import { beforeAll, expect, test } from "vitest";
import { prisma } from "@/server/db";
import { getStudentResults } from "@/server/results/service";
import { runSeed } from "../../../prisma/seed/index";

async function releasedFor(fullName: string) {
  const student = await prisma.student.findFirstOrThrow({ where: { fullName } });
  const modules = await getStudentResults(student.id);
  return Object.fromEntries(
    modules.map((module_) => [
      module_.code,
      module_.released ? module_.assessments.map((a) => `${a.title}: ${a.grade} ${a.classification}`) : "not released",
    ]),
  );
}

beforeAll(async () => {
  await runSeed(prisma, { today: "2026-11-14", password: "seed-test-password" });
});

test("the seed has Published, Pending, and Withheld module results", async () => {
  const states = await prisma.moduleResult.findMany({ select: { state: true } });

  expect(new Set(states.map((row) => row.state))).toEqual(new Set(["PUBLISHED", "WITHHELD"]));
  expect(await prisma.grade.count()).toBe(7);
});

test("each seeded student's results show only their Published modules", async () => {
  expect(await releasedFor("Amara Okafor")).toEqual({
    CS101: ["Lab report 1: 72 Distinction", "Programming test: 68 Merit"],
    CS102: "not released",
  });
  expect(await releasedFor("Liam Chen")).toEqual({ CS101: "not released", CS102: "not released" });
  expect(await releasedFor("Priya Patel")).toEqual({ CS101: "not released", CS102: "not released" });
  expect(await releasedFor("Sofia Rossi")).toEqual({ DS501: ["Regression project: 64 Merit"], DS502: "not released" });
  expect(await releasedFor("Daniel Mensah")).toEqual({ DS501: ["Regression project: 81 Distinction"], DS502: "not released" });
});

test("Priya's CS101 results stay Pending because her lab report has no grade", async () => {
  const priya = await prisma.student.findFirstOrThrow({ where: { fullName: "Priya Patel" } });

  expect(await prisma.moduleResult.count({ where: { studentId: priya.id } })).toBe(0);
  expect(await prisma.grade.count({ where: { studentId: priya.id } })).toBe(1);
});
