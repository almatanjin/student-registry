import { beforeEach, describe, expect, test } from "vitest";
import { PUT as setGrade } from "@/app/api/assessments/[id]/grades/[studentId]/route";
import { POST as publishModule } from "@/app/api/modules/[id]/publish/route";
import { GET as getResults } from "@/app/api/students/[id]/results/route";
import { PUT as setResultState } from "@/app/api/students/[id]/modules/[moduleId]/result/route";
import { prisma } from "@/server/db";
import { resetDatabase } from "../helpers/database";
import { createAssessment, createModule, createProgramme, createStudentRecord } from "../helpers/fixtures";
import { jsonRequest, withParams, type ErrorJson } from "../helpers/http";
import { actAs, staffUser, studentUser } from "../helpers/session";

type ResultsJson = {
  modules: {
    moduleId: string;
    code: string;
    released: boolean;
    assessments?: { title: string; grade: number; classification: string }[];
  }[];
};

let programmeId: string;
let moduleId: string;
let labId: string;
let essayId: string;
let studentId: string;

beforeEach(async () => {
  await resetDatabase();
  programmeId = (await createProgramme()).id;
  moduleId = (await createModule(programmeId, { code: "CS101" })).id;
  labId = (await createAssessment(moduleId, { title: "Lab report" })).id;
  essayId = (await createAssessment(moduleId, { title: "Essay" })).id;
  studentId = (await createStudentRecord({ programmeId })).id;
  actAs(staffUser());
});

function grade(assessmentId: string, student: string, value: unknown) {
  return setGrade(
    jsonRequest("PUT", `/api/assessments/${assessmentId}/grades/${student}`, { grade: value }),
    withParams({ id: assessmentId, studentId: student }),
  );
}

function setState(student: string, state: string, module = moduleId) {
  return setResultState(
    jsonRequest("PUT", `/api/students/${student}/modules/${module}/result`, { state }),
    withParams({ id: student, moduleId: module }),
  );
}

async function results(student = studentId) {
  const response = await getResults(jsonRequest("GET", `/api/students/${student}/results`), withParams({ id: student }));
  return { status: response.status, body: (await response.json()) as ResultsJson };
}

async function storedGrade(assessmentId: string, student = studentId) {
  return (await prisma.grade.findUnique({ where: { assessmentId_studentId: { assessmentId, studentId: student } } }))?.value;
}

describe("Staff enter grades", () => {
  test("Entering a grade", async () => {
    const response = await grade(labId, studentId, 72);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ grade: { value: 72, classification: "Distinction" }, published: false });
    expect(await storedGrade(labId)).toBe(72);
  });

  test("changing and clearing a grade", async () => {
    await grade(labId, studentId, 50);
    await grade(labId, studentId, "64");
    expect(await storedGrade(labId)).toBe(64);

    const cleared = await grade(labId, studentId, null);

    expect(cleared.status).toBe(200);
    expect(await storedGrade(labId)).toBeUndefined();
  });

  test("Out-of-range or non-numeric grade", async () => {
    await grade(labId, studentId, 58);
    for (const bad of [-1, 101, 65.5, "text"]) {
      const response = await grade(labId, studentId, bad);

      expect(response.status, String(bad)).toBe(400);
      expect(((await response.json()) as ErrorJson).error.fields).toEqual({ grade: "Enter a whole number from 0 to 100" });
    }
    expect(await storedGrade(labId)).toBe(58);
  });

  test("Student with no submission", async () => {
    const response = await grade(labId, studentId, 0);

    expect(response.status).toBe(200);
    expect(await storedGrade(labId)).toBe(0);
  });

  test("Student not on the programme", async () => {
    const outsider = await createStudentRecord({ programmeId: (await createProgramme()).id });

    const response = await grade(labId, outsider.id, 70);

    expect(response.status).toBe(400);
    expect(await prisma.grade.count()).toBe(0);
  });

  test("an unknown assessment answers 404", async () => {
    expect((await grade("missing", studentId, 50)).status).toBe(404);
  });

  test("Students cannot enter grades", async () => {
    actAs(studentUser(studentId));

    expect((await grade(labId, studentId, 100)).status).toBe(403);
    expect(await prisma.grade.count()).toBe(0);
  });
});

describe("Only complete results can be published", () => {
  test("Missing grade", async () => {
    await grade(labId, studentId, 65);

    const response = await setState(studentId, "PUBLISHED");

    expect(response.status).toBe(409);
    expect(((await response.json()) as ErrorJson).error.message).toBe("Results cannot be published yet: no grade for Essay");
    expect(await prisma.moduleResult.count()).toBe(0);
  });

  test("complete results can be published", async () => {
    await grade(labId, studentId, 65);
    await grade(essayId, studentId, 38);

    const response = await setState(studentId, "PUBLISHED");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ result: { state: "PUBLISHED" } });
  });

  test("withholding and returning to Pending do not need complete results", async () => {
    expect((await setState(studentId, "WITHHELD")).status).toBe(200);
    expect((await setState(studentId, "PENDING")).status).toBe(200);
  });

  test("a module from another programme answers 404", async () => {
    const otherModule = await createModule((await createProgramme()).id);

    expect((await setState(studentId, "WITHHELD", otherModule.id)).status).toBe(404);
  });

  test("an unknown state is rejected", async () => {
    expect((await setState(studentId, "RELEASED")).status).toBe(400);
  });
});

describe("Staff publish all complete results for a module at once", () => {
  test("Bulk publish skips withheld results", async () => {
    const students = [studentId];
    for (let i = 0; i < 5; i += 1) students.push((await createStudentRecord({ programmeId })).id);
    const [a, b, c, d, withheld, incomplete] = students;
    for (const id of [a, b, c, d, withheld]) {
      await grade(labId, id, 55);
      await grade(essayId, id, 61);
    }
    await grade(labId, incomplete, 70);
    await setState(withheld, "WITHHELD");

    const response = await publishModule(jsonRequest("POST", `/api/modules/${moduleId}/publish`), withParams({ id: moduleId }));

    expect(await response.json()).toEqual({ published: 4, skipped: 2, message: "4 published, 2 skipped" });
    const states = await prisma.moduleResult.findMany({ select: { studentId: true, state: true } });
    const byStudent = Object.fromEntries(states.map((row) => [row.studentId, row.state]));
    expect([a, b, c, d].map((id) => byStudent[id])).toEqual(["PUBLISHED", "PUBLISHED", "PUBLISHED", "PUBLISHED"]);
    expect(byStudent[withheld]).toBe("WITHHELD");
    expect(byStudent[incomplete]).toBeUndefined();
  });

  test("Students cannot publish", async () => {
    actAs(studentUser(studentId));

    expect((await publishModule(jsonRequest("POST", `/api/modules/${moduleId}/publish`), withParams({ id: moduleId }))).status).toBe(403);
  });
});

describe("Students see only published results", () => {
  beforeEach(async () => {
    await grade(labId, studentId, 72);
    await grade(essayId, studentId, 39);
  });

  test("Published module", async () => {
    await setState(studentId, "PUBLISHED");
    actAs(studentUser(studentId));

    const { body } = await results();

    expect(body.modules).toEqual([
      expect.objectContaining({
        code: "CS101",
        released: true,
        assessments: [
          { title: "Essay", grade: 39, classification: "Fail" },
          { title: "Lab report", grade: 72, classification: "Distinction" },
        ],
      }),
    ]);
  });

  test("Requesting unpublished grades directly", async () => {
    actAs(studentUser(studentId));

    for (const state of ["PENDING", "WITHHELD"]) {
      actAs(staffUser());
      await setState(studentId, state);
      actAs(studentUser(studentId));

      const { body } = await results();
      const raw = JSON.stringify(body);

      expect(body.modules).toEqual([{ moduleId, code: "CS101", title: expect.any(String), released: false }]);
      expect(raw).not.toContain("72");
      expect(raw).not.toContain("39");
      expect(raw).not.toMatch(/withheld/i);
    }
  });

  test("Withholding a published result", async () => {
    await setState(studentId, "PUBLISHED");
    await setState(studentId, "WITHHELD");
    actAs(studentUser(studentId));

    expect((await results()).body.modules[0].released).toBe(false);
  });

  test("Student requests another student's data", async () => {
    const other = await createStudentRecord({ programmeId });
    actAs(studentUser(other.id));

    expect((await results(studentId)).status).toBe(404);
  });
});

describe("Grade changes after publishing are visible", () => {
  test("Correcting a published grade", async () => {
    await grade(labId, studentId, 58);
    await grade(essayId, studentId, 70);
    await setState(studentId, "PUBLISHED");

    const response = await grade(labId, studentId, 61);

    expect(await response.json()).toMatchObject({ grade: { value: 61, classification: "Merit" }, published: true });
    actAs(studentUser(studentId));
    const { body } = await results();
    expect(body.modules[0].assessments).toContainEqual({ title: "Lab report", grade: 61, classification: "Merit" });
  });
});
