import { beforeEach, describe, expect, test } from "vitest";
import { GET as getFees } from "@/app/api/students/[id]/fees/route";
import { POST as recordPayment } from "@/app/api/students/[id]/payments/route";
import { today } from "@/server/config";
import { prisma } from "@/server/db";
import { billStudent } from "@/server/fees/billing";
import { resetDatabase } from "../helpers/database";
import { createProgramme, createStaffAccount, createStudentRecord } from "../helpers/fixtures";
import { jsonRequest, withParams, type ErrorJson } from "../helpers/http";
import { actAs, staffUser, studentUser } from "../helpers/session";

type FeesJson = {
  fees: {
    totalMinor: number;
    paidMinor: number;
    outstandingMinor: number;
    dueToDateMinor: number;
    overdueMinor: number;
    instalments: { sequence: number; state: string }[];
    payments: { amountMinor: number; paidOn: string; reference: string }[];
  };
};

let studentId: string;
let staffId: string;

/** A student owing 1,000.00 in two instalments: one long past due, one far in the future. */
beforeEach(async () => {
  await resetDatabase();
  const programme = await createProgramme({
    annualFeeMinor: 100_000,
    feePlan: [
      { sequence: 1, amountMinor: 50_000, dueMonth: 10, dueDay: 1 },
      { sequence: 2, amountMinor: 50_000, dueMonth: 2, dueDay: 1 },
    ],
  });
  const student = await createStudentRecord({ programmeId: programme.id, academicYearStart: 2020 });
  await prisma.$transaction((tx) => billStudent(tx, { id: student.id, programmeId: programme.id, academicYearStart: 2020 }));
  await prisma.studentInstalment.update({
    where: { studentId_sequence: { studentId: student.id, sequence: 2 } },
    data: { dueDate: new Date("2999-02-01T00:00:00Z") },
  });
  studentId = student.id;
  staffId = (await createStaffAccount()).id;
  actAs(staffUser({ id: staffId }));
});

function pay(body: Record<string, unknown>, id = studentId) {
  return recordPayment(jsonRequest("POST", `/api/students/${id}/payments`, body), withParams({ id }));
}

async function fees(id = studentId) {
  const response = await getFees(jsonRequest("GET", `/api/students/${id}/fees`), withParams({ id }));
  return { status: response.status, body: (await response.json()) as FeesJson };
}

describe("Staff record payments", () => {
  test("Valid payment", async () => {
    const response = await pay({ amount: "250.00", paidOn: today(), reference: "BANK-77812" });

    expect(response.status).toBe(201);
    const { body } = await fees();
    expect(body.fees.payments).toEqual([
      expect.objectContaining({ amountMinor: 25_000, paidOn: today(), reference: "BANK-77812" }),
    ]);
    expect(body.fees.outstandingMinor).toBe(75_000);
    const stored = await prisma.payment.findFirstOrThrow();
    expect(stored.recordedById).toBe(staffId);
  });

  test("Duplicate reference number", async () => {
    await pay({ amount: "10", paidOn: today(), reference: "BANK-1" });

    const response = await pay({ amount: "10", paidOn: today(), reference: " bank-1 " });

    expect(response.status).toBe(409);
    expect(((await response.json()) as ErrorJson).error).toMatchObject({
      message: "This reference number has already been recorded",
      fields: { reference: "This reference number has already been recorded" },
    });
    expect(await prisma.payment.count()).toBe(1);
  });

  test("a reference used for another student is also a duplicate", async () => {
    const other = await createStudentRecord({ programmeId: (await prisma.programme.findFirstOrThrow()).id });
    await prisma.payment.create({
      data: { studentId: other.id, recordedById: staffId, amountMinor: 1, paidOn: new Date(), reference: "SHARED-REF" },
    });

    expect((await pay({ amount: "10", paidOn: today(), reference: "SHARED-REF" })).status).toBe(409);
  });

  test("Invalid amount or date", async () => {
    const cases: [Record<string, unknown>, string][] = [
      [{ amount: "0", paidOn: today(), reference: "R1" }, "amount"],
      [{ amount: "-5", paidOn: today(), reference: "R2" }, "amount"],
      [{ amount: "1.234", paidOn: today(), reference: "R3" }, "amount"],
      [{ amount: "10", paidOn: "2999-01-01", reference: "R4" }, "paidOn"],
      [{ amount: "10", paidOn: "not-a-date", reference: "R5" }, "paidOn"],
      [{ amount: "10", paidOn: today(), reference: "  " }, "reference"],
    ];
    for (const [body, field] of cases) {
      const response = await pay(body);

      expect(response.status, JSON.stringify(body)).toBe(400);
      expect(((await response.json()) as ErrorJson).error.fields).toHaveProperty(field);
    }
    expect(await prisma.payment.count()).toBe(0);
  });

  test("a payment to a student that does not exist answers 404", async () => {
    expect((await pay({ amount: "10", paidOn: today(), reference: "R9" }, "missing")).status).toBe(404);
  });
});

describe("Payments cannot exceed the outstanding balance", () => {
  test("Overpayment attempt", async () => {
    const response = await pay({ amount: "1,200.00", paidOn: today(), reference: "OVER-1" });

    expect(response.status).toBe(409);
    const { error } = (await response.json()) as ErrorJson;
    expect(error.message).toContain("£1,000.00");
    expect(error.fields).toHaveProperty("amount");
  });

  test("Paying off in full", async () => {
    const response = await pay({ amount: "1000", paidOn: today(), reference: "FULL-1" });

    expect(response.status).toBe(201);
    expect((await fees()).body.fees.outstandingMinor).toBe(0);
  });

  test("two payments at the same moment cannot together overpay", async () => {
    const responses = await Promise.all([
      pay({ amount: "1000", paidOn: today(), reference: "RACE-1" }),
      pay({ amount: "1000", paidOn: today(), reference: "RACE-2" }),
    ]);

    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await prisma.payment.count()).toBe(1);
  });
});

describe("Balances are always current", () => {
  test("Balance after a payment", async () => {
    expect((await fees()).body.fees).toMatchObject({ outstandingMinor: 100_000, overdueMinor: 50_000 });

    await pay({ amount: "500", paidOn: today(), reference: "CLEAR-1" });

    expect((await fees()).body.fees).toMatchObject({ outstandingMinor: 50_000, overdueMinor: 0 });
  });

  test("payment history is newest first", async () => {
    await pay({ amount: "1", paidOn: "2021-01-01", reference: "OLD" });
    await pay({ amount: "2", paidOn: today(), reference: "NEW" });

    expect((await fees()).body.fees.payments.map((p) => p.reference)).toEqual(["NEW", "OLD"]);
  });
});

describe("who may see and record payments", () => {
  test("Student calls a staff API operation", async () => {
    actAs(studentUser(studentId));

    const response = await pay({ amount: "10", paidOn: today(), reference: "SELF-PAY" });

    expect(response.status).toBe(403);
    expect(await prisma.payment.count()).toBe(0);
  });

  test("a Student sees their own fees", async () => {
    actAs(studentUser(studentId));

    expect((await fees()).status).toBe(200);
  });

  test("Student requests another student's data", async () => {
    const other = await createStudentRecord({ programmeId: (await prisma.programme.findFirstOrThrow()).id });
    actAs(studentUser(other.id));

    expect((await fees()).status).toBe(404);
  });
});
