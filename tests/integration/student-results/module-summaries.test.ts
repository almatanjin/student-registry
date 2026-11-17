import { beforeEach, describe, expect, test } from "vitest";
import { listModuleResultSummaries, setGrade, setResultState } from "@/server/results/service";
import { resetDatabase } from "../helpers/database";
import { createAssessment, createModule, createProgramme, createStudentRecord } from "../helpers/fixtures";

let programmeId: string;

beforeEach(async () => {
  await resetDatabase();
  programmeId = (await createProgramme({ code: "BSC-CS", name: "BSc Computer Science" })).id;
});

async function moduleWithTwoAssessments(code = "CS101") {
  const module_ = await createModule(programmeId, { code, title: "Programming Fundamentals" });
  const first = await createAssessment(module_.id);
  const second = await createAssessment(module_.id);
  return { moduleId: module_.id, assessments: [first.id, second.id] };
}

async function gradeAll(assessments: string[], studentId: string) {
  for (const assessmentId of assessments) await setGrade(assessmentId, studentId, { grade: 64 });
}

async function summaryFor(moduleId: string) {
  const found = (await listModuleResultSummaries()).find((summary) => summary.id === moduleId);
  if (!found) throw new Error("module missing from the summaries");
  return found;
}

describe("Counting results per module", () => {
  test("each student is counted once by where their result stands", async () => {
    const { moduleId, assessments } = await moduleWithTwoAssessments();
    const ready = await createStudentRecord({ programmeId });
    const alsoReady = await createStudentRecord({ programmeId });
    const missingOne = await createStudentRecord({ programmeId });
    await createStudentRecord({ programmeId }); // no grades at all
    const withheld = await createStudentRecord({ programmeId });
    const published = await createStudentRecord({ programmeId });
    await gradeAll(assessments, ready.id);
    await gradeAll(assessments, alsoReady.id);
    await setGrade(assessments[0], missingOne.id, { grade: 70 });
    await gradeAll(assessments, withheld.id);
    await setResultState(withheld.id, moduleId, { state: "WITHHELD" });
    await gradeAll(assessments, published.id);
    await setResultState(published.id, moduleId, { state: "PUBLISHED" });

    expect(await summaryFor(moduleId)).toEqual({
      id: moduleId,
      code: "CS101",
      title: "Programming Fundamentals",
      programmeName: "BSc Computer Science",
      assessmentCount: 2,
      counts: { students: 6, ready: 2, waiting: 2, withheld: 1, published: 1 },
    });
  });

  test("a withheld result counts as withheld even when grades are missing", async () => {
    const { moduleId } = await moduleWithTwoAssessments();
    const student = await createStudentRecord({ programmeId });
    await setResultState(student.id, moduleId, { state: "WITHHELD" });

    expect((await summaryFor(moduleId)).counts).toEqual({ students: 1, ready: 0, waiting: 0, withheld: 1, published: 0 });
  });

  test("Programme without students", async () => {
    const { moduleId } = await moduleWithTwoAssessments();

    expect(await summaryFor(moduleId)).toMatchObject({
      assessmentCount: 2,
      counts: { students: 0, ready: 0, waiting: 0, withheld: 0, published: 0 },
    });
  });

  test("Module without assessments", async () => {
    const module_ = await createModule(programmeId);
    await createStudentRecord({ programmeId });

    expect(await summaryFor(module_.id)).toMatchObject({
      assessmentCount: 0,
      counts: { students: 1, ready: 0, waiting: 0, withheld: 0, published: 0 },
    });
  });

  test("students on another programme are not counted", async () => {
    const { moduleId, assessments } = await moduleWithTwoAssessments();
    await createStudentRecord({ programmeId: (await createProgramme()).id });
    await gradeAll(assessments, (await createStudentRecord({ programmeId })).id);

    expect((await summaryFor(moduleId)).counts).toEqual({ students: 1, ready: 1, waiting: 0, withheld: 0, published: 0 });
  });

  test("modules are listed by programme name, then module code", async () => {
    const other = await createProgramme({ code: "MSC-DS", name: "MSc Data Science" });
    await createModule(other.id, { code: "DS501" });
    await createModule(programmeId, { code: "CS102" });
    await createModule(programmeId, { code: "CS101" });

    expect((await listModuleResultSummaries()).map((summary) => summary.code)).toEqual(["CS101", "CS102", "DS501"]);
  });
});
