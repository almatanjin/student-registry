import { beforeEach, describe, expect, test } from "vitest";
import { createAssessment as createAssessmentService } from "@/server/assessments/service";
import { getModuleResults, getStudentResults, setGrade, setResultState } from "@/server/results/service";
import { resetDatabase } from "../helpers/database";
import { createAssessment, createModule, createProgramme, createStudentRecord } from "../helpers/fixtures";

let programmeId: string;
let moduleId: string;
let firstAssessment: string;

beforeEach(async () => {
  await resetDatabase();
  programmeId = (await createProgramme({ code: "BSC-CS", name: "BSc Computer Science" })).id;
  moduleId = (await createModule(programmeId, { code: "CS101", title: "Programming Fundamentals" })).id;
  firstAssessment = (await createAssessment(moduleId)).id;
});

function addAssessment(title = "Essay 2") {
  return createAssessmentService({ title, moduleId, deadline: "2099-12-01T17:00" });
}

async function stateOf(studentId: string) {
  const row = (await getModuleResults(moduleId)).rows.find((entry) => entry.student.id === studentId);
  if (!row) throw new Error("student missing from the module results");
  return row.state;
}

async function publishedStudent() {
  const student = await createStudentRecord({ programmeId });
  await setGrade(firstAssessment, student.id, { grade: 72 });
  await setResultState(student.id, moduleId, { state: "PUBLISHED" });
  return student;
}

describe("Adding an assessment reopens published results", () => {
  test("New assessment in a published module", async () => {
    const student = await publishedStudent();

    await addAssessment();

    expect(await stateOf(student.id)).toBe("PENDING");
    const cs101 = (await getStudentResults(student.id)).find((module_) => module_.moduleId === moduleId);
    expect(cs101?.released).toBe(false);
  });

  test("Withheld result stays withheld", async () => {
    const withheld = await createStudentRecord({ programmeId });
    await setGrade(firstAssessment, withheld.id, { grade: 55 });
    await setResultState(withheld.id, moduleId, { state: "WITHHELD" });
    const pending = await createStudentRecord({ programmeId });

    await addAssessment();

    expect(await stateOf(withheld.id)).toBe("WITHHELD");
    expect(await stateOf(pending.id)).toBe("PENDING");
  });

  test("results in other modules are not touched", async () => {
    const otherModule = (await createModule(programmeId, { code: "CS102", title: "Databases" })).id;
    const otherAssessment = (await createAssessment(otherModule)).id;
    const student = await createStudentRecord({ programmeId });
    await setGrade(otherAssessment, student.id, { grade: 61 });
    await setResultState(student.id, otherModule, { state: "PUBLISHED" });

    await addAssessment();

    const cs102 = (await getStudentResults(student.id)).find((module_) => module_.moduleId === otherModule);
    expect(cs102?.released).toBe(true);
  });

  test("Publishing at the same moment", async () => {
    // Publishing checks completeness and creating resets results; whichever runs first,
    // the student must never end up Published while the new assessment has no grade.
    for (let round = 0; round < 8; round += 1) {
      const student = await createStudentRecord({ programmeId });
      await setGrade(firstAssessment, student.id, { grade: 72 });

      const [publish] = await Promise.allSettled([
        setResultState(student.id, moduleId, { state: "PUBLISHED" }),
        addAssessment(`Essay round ${round}`),
      ]);

      const view = await getModuleResults(moduleId);
      const row = view.rows.find((entry) => entry.student.id === student.id);
      expect(row?.missing.length, `round ${round}`).toBeGreaterThan(0);
      expect(row?.state, `round ${round} (publish ${publish.status})`).not.toBe("PUBLISHED");
    }
  });
});
