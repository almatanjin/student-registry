import { beforeEach, describe, expect, test } from "vitest";
import { getDashboardSummary } from "@/server/dashboard/service";
import { listOverdueStudents } from "@/server/fees/overdue";
import { recordPayment } from "@/server/fees/service";
import { publishModule, setGrade, setResultState } from "@/server/results/service";
import { today } from "@/server/config";
import { prisma } from "@/server/db";
import { resetDatabase } from "../helpers/database";
import {
  createAssessment,
  createModule,
  createProgramme,
  createStaffAccount,
  createStudentRecord,
  recordPaymentDirectly,
} from "../helpers/fixtures";

const TODAY = "2026-11-16";
let programmeId: string;
let staffId: string;

beforeEach(async () => {
  await resetDatabase();
  programmeId = (await createProgramme()).id;
  staffId = (await createStaffAccount()).id;
});

/** A student billed the given instalments (amount in pence, due date). */
async function billedStudent(instalments: [number, string][], status: "ENROLLED" | "WITHDRAWN" = "ENROLLED") {
  const student = await createStudentRecord({ programmeId, status });
  await prisma.studentInstalment.createMany({
    data: instalments.map(([amountMinor, due], index) => ({
      studentId: student.id,
      sequence: index + 1,
      amountMinor,
      dueDate: new Date(`${due}T00:00:00Z`),
    })),
  });
  return student;
}

async function summary() {
  return getDashboardSummary(await listOverdueStudents(TODAY));
}

describe("Enrolled students card", () => {
  test("Mixed statuses", async () => {
    for (let i = 0; i < 4; i++) await createStudentRecord({ programmeId, status: "ENROLLED" });
    await createStudentRecord({ programmeId, status: "DEFERRED" });
    await createStudentRecord({ programmeId, status: "WITHDRAWN" });

    expect((await summary()).enrolled).toEqual({
      count: 4,
      others: [
        { status: "DEFERRED", count: 1 },
        { status: "WITHDRAWN", count: 1 },
      ],
    });
  });

  test("no students at all", async () => {
    expect((await summary()).enrolled).toEqual({ count: 0, others: [] });
  });
});

describe("Overdue balances card", () => {
  test("Students overdue", async () => {
    const first = await billedStudent([[300_000, "2026-10-01"]]);
    await recordPaymentDirectly(first.id, staffId, 150_000);
    await billedStudent([[300_000, "2026-10-01"]], "WITHDRAWN");
    await billedStudent([[300_000, "2027-01-15"]]); // not due yet

    expect((await summary()).overdue).toEqual({ count: 2, totalMinor: 450_000 });
  });

  test("Nobody overdue", async () => {
    const paid = await billedStudent([[300_000, "2026-10-01"]]);
    await recordPaymentDirectly(paid.id, staffId, 300_000);

    expect((await summary()).overdue).toEqual({ count: 0, totalMinor: 0 });
  });
});

describe("Fees collected card", () => {
  test("Part collected", async () => {
    const first = await billedStudent([[900_000, "2026-10-01"]]);
    const second = await billedStudent([[1_200_000, "2027-02-01"]]);
    await recordPaymentDirectly(first.id, staffId, 900_000);
    await recordPaymentDirectly(second.id, staffId, 405_000);

    expect((await summary()).fees).toEqual({ paidMinor: 1_305_000, billedMinor: 2_100_000, percent: 62 });
  });

  test("Almost fully paid", async () => {
    const student = await billedStudent([[100_000, "2027-02-01"]]);
    await recordPaymentDirectly(student.id, staffId, 99_600);

    expect((await summary()).fees.percent).toBe(99);
  });

  test("fully paid shows 100%", async () => {
    const student = await billedStudent([[100_000, "2027-02-01"]]);
    await recordPaymentDirectly(student.id, staffId, 100_000);

    expect((await summary()).fees.percent).toBe(100);
  });

  test("Nothing billed", async () => {
    await createStudentRecord({ programmeId });

    expect((await summary()).fees).toEqual({ paidMinor: 0, billedMinor: 0, percent: 0 });
  });
});

describe("Cards reflect current records", () => {
  test("After recording a payment", async () => {
    const student = await billedStudent([[300_000, "2026-10-01"]]);
    expect((await summary()).fees.paidMinor).toBe(0);

    await recordPayment(student.id, { amount: "1,000.00", paidOn: today(), reference: "BANK-1" }, staffId);

    expect((await summary()).fees).toMatchObject({ paidMinor: 100_000, billedMinor: 300_000, percent: 33 });
  });
});

describe("Results to publish card", () => {
  async function moduleWithTwoAssessments() {
    const module_ = await createModule(programmeId);
    const first = await createAssessment(module_.id);
    const second = await createAssessment(module_.id);
    return { moduleId: module_.id, assessments: [first.id, second.id] };
  }

  test("Complete and incomplete results", async () => {
    const { moduleId, assessments } = await moduleWithTwoAssessments();
    const complete = await createStudentRecord({ programmeId });
    const missingOne = await createStudentRecord({ programmeId });
    const withheld = await createStudentRecord({ programmeId });
    for (const assessmentId of assessments) {
      await setGrade(assessmentId, complete.id, { grade: 65 });
      await setGrade(assessmentId, withheld.id, { grade: 50 });
    }
    await setGrade(assessments[0], missingOne.id, { grade: 72 });
    await setResultState(withheld.id, moduleId, { state: "WITHHELD" });

    expect((await summary()).resultsToPublish).toBe(1);
  });

  test("a module with no assessments is not counted", async () => {
    await createModule(programmeId);
    await createStudentRecord({ programmeId });

    expect((await summary()).resultsToPublish).toBe(0);
  });

  test("Publishing clears the count", async () => {
    const { moduleId, assessments } = await moduleWithTwoAssessments();
    const student = await createStudentRecord({ programmeId });
    for (const assessmentId of assessments) await setGrade(assessmentId, student.id, { grade: 80 });
    expect((await summary()).resultsToPublish).toBe(1);

    await publishModule(moduleId);

    expect((await summary()).resultsToPublish).toBe(0);
  });

  test("students on another programme are not counted for this module", async () => {
    const { assessments } = await moduleWithTwoAssessments();
    const other = (await createProgramme()).id;
    await createStudentRecord({ programmeId: other });
    const student = await createStudentRecord({ programmeId });
    for (const assessmentId of assessments) await setGrade(assessmentId, student.id, { grade: 55 });

    expect((await summary()).resultsToPublish).toBe(1);
  });
});
