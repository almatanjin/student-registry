import { beforeEach, describe, expect, test } from "vitest";
import { GET as listAssessments, POST as createAssessmentRoute } from "@/app/api/assessments/route";
import { GET as getAssessment, PATCH as updateAssessment } from "@/app/api/assessments/[id]/route";
import { prisma } from "@/server/db";
import { resetDatabase } from "../helpers/database";
import { createAssessment, createModule, createProgramme, createStudentRecord } from "../helpers/fixtures";
import { jsonRequest, withParams, type ErrorJson } from "../helpers/http";
import { actAs, staffUser, studentUser } from "../helpers/session";

type AssessmentJson = {
  id: string;
  title: string;
  deadline: string;
  isOpen: boolean;
  module: { id: string; code: string; title: string; programmeName: string };
};

const inAWeek = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

let moduleId: string;
let programmeId: string;

beforeEach(async () => {
  await resetDatabase();
  programmeId = (await createProgramme({ name: "BSc Computer Science" })).id;
  moduleId = (await createModule(programmeId, { code: "CS101", title: "Programming Fundamentals" })).id;
  actAs(staffUser());
});

function create(body: Record<string, unknown>) {
  return createAssessmentRoute(jsonRequest("POST", "/api/assessments", body), withParams({}));
}

function update(id: string, body: Record<string, unknown>) {
  return updateAssessment(jsonRequest("PATCH", `/api/assessments/${id}`, body), withParams({ id }));
}

describe("Staff create assessments", () => {
  test("Valid assessment", async () => {
    const deadline = inAWeek().toISOString();

    const response = await create({ title: "Essay 1", moduleId, deadline });

    expect(response.status).toBe(201);
    const { assessment } = (await response.json()) as { assessment: AssessmentJson };
    expect(assessment).toMatchObject({
      title: "Essay 1",
      isOpen: true,
      deadline,
      module: { code: "CS101", programmeName: "BSc Computer Science" },
    });
  });

  test("a local date-time is read in the app's time zone", async () => {
    const response = await create({ title: "Essay 2", moduleId, deadline: "2099-12-01T17:00" });

    expect(((await response.json()) as { assessment: AssessmentJson }).assessment.deadline).toBe("2099-12-01T17:00:00.000Z");
  });

  test("Deadline in the past", async () => {
    const response = await create({ title: "Late setter", moduleId, deadline: "2020-01-01T09:00:00Z" });

    expect(response.status).toBe(400);
    expect(((await response.json()) as ErrorJson).error.fields).toEqual({ deadline: "The deadline must be in the future" });
    expect(await prisma.assessment.count()).toBe(0);
  });

  test("title, module, and deadline are all required", async () => {
    const response = await create({ title: " " });

    expect(Object.keys(((await response.json()) as ErrorJson).error.fields ?? {}).sort()).toEqual([
      "deadline",
      "moduleId",
      "title",
    ]);
  });

  test("an unknown module is reported on the module field", async () => {
    const response = await create({ title: "Essay", moduleId: "missing", deadline: inAWeek().toISOString() });

    expect(response.status).toBe(400);
    expect(((await response.json()) as ErrorJson).error.fields).toEqual({ moduleId: "Choose a module" });
  });

  test("Students cannot create assessments", async () => {
    actAs(studentUser("someone"));

    expect((await create({ title: "Essay", moduleId, deadline: inAWeek().toISOString() })).status).toBe(403);
  });
});

describe("Staff edit, close, and reopen assessments", () => {
  test("Extending a deadline", async () => {
    const assessment = await createAssessment(moduleId);
    const later = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const response = await update(assessment.id, { deadline: later, title: "Essay 1 (extended)" });

    expect(response.status).toBe(200);
    expect(((await response.json()) as { assessment: AssessmentJson }).assessment).toMatchObject({
      deadline: later,
      title: "Essay 1 (extended)",
    });
  });

  test("an edited deadline may be in the past, to close a window early", async () => {
    const assessment = await createAssessment(moduleId);

    expect((await update(assessment.id, { deadline: "2020-01-01T09:00:00Z" })).status).toBe(200);
  });

  test("Closing an assessment, then reopening it", async () => {
    const assessment = await createAssessment(moduleId);

    const closed = await update(assessment.id, { isOpen: false });
    expect(((await closed.json()) as { assessment: AssessmentJson }).assessment.isOpen).toBe(false);

    const reopened = await update(assessment.id, { isOpen: true });
    expect(((await reopened.json()) as { assessment: AssessmentJson }).assessment.isOpen).toBe(true);
  });

  test("editing an assessment that does not exist answers 404", async () => {
    expect((await update("missing", { title: "x" })).status).toBe(404);
  });
});

describe("Students see their assessments", () => {
  test("Assessment list", async () => {
    const otherProgramme = await createProgramme();
    const otherModule = await createModule(otherProgramme.id);
    await createAssessment(moduleId, { title: "Mine" });
    await createAssessment(otherModule.id, { title: "Not mine" });
    const student = await createStudentRecord({ programmeId });
    actAs(studentUser(student.id));

    const response = await listAssessments(jsonRequest("GET", "/api/assessments"), withParams({}));

    const { assessments } = (await response.json()) as { assessments: (AssessmentJson & { submission: { state: string } })[] };
    expect(assessments.map((a) => [a.title, a.submission.state])).toEqual([["Mine", "missing"]]);
  });

  test("staff see every assessment with submission counts", async () => {
    const assessment = await createAssessment(moduleId, { title: "Essay" });
    await createStudentRecord({ programmeId });
    await createStudentRecord({ programmeId });

    const response = await listAssessments(jsonRequest("GET", "/api/assessments"), withParams({}));

    const { assessments } = (await response.json()) as { assessments: (AssessmentJson & { counts: object })[] };
    expect(assessments).toEqual([
      expect.objectContaining({ id: assessment.id, counts: { onTime: 0, late: 0, missing: 2 } }),
    ]);
  });

  test("a Student cannot open the staff view of an assessment", async () => {
    const assessment = await createAssessment(moduleId);
    const student = await createStudentRecord({ programmeId });
    actAs(studentUser(student.id));

    const response = await getAssessment(jsonRequest("GET", `/api/assessments/${assessment.id}`), withParams({ id: assessment.id }));

    expect(response.status).toBe(403);
  });
});
