import { beforeEach, describe, expect, test } from "vitest";
import { POST as createStudent } from "@/app/api/students/route";
import { PATCH as updateStudent } from "@/app/api/students/[id]/route";
import { prisma } from "@/server/db";
import { resetDatabase } from "../helpers/database";
import { createProgramme } from "../helpers/fixtures";
import { jsonRequest, withParams } from "../helpers/http";
import { actAs, staffUser } from "../helpers/session";

let bscId: string;
let mscId: string;

beforeEach(async () => {
  await resetDatabase();
  actAs(staffUser());
  bscId = (
    await createProgramme({
      code: "BSC",
      annualFeeMinor: 900_000,
      feePlan: [
        { sequence: 1, amountMinor: 450_000, dueMonth: 10, dueDay: 1 },
        { sequence: 2, amountMinor: 450_000, dueMonth: 2, dueDay: 1 },
      ],
    })
  ).id;
  mscId = (
    await createProgramme({
      code: "MSC",
      annualFeeMinor: 1_200_000,
      feePlan: [
        { sequence: 1, amountMinor: 400_000, dueMonth: 9, dueDay: 15 },
        { sequence: 2, amountMinor: 400_000, dueMonth: 1, dueDay: 15 },
        { sequence: 3, amountMinor: 400_000, dueMonth: 5, dueDay: 15 },
      ],
    })
  ).id;
});

async function newStudent(programmeId: string, academicYear = "2025/26") {
  const response = await createStudent(
    jsonRequest("POST", "/api/students", {
      fullName: "Billing Test",
      email: `billing-${Math.random()}@sms.example`,
      dateOfBirth: "2004-01-01",
      programmeId,
      academicYear,
      status: "ENROLLED",
      initialPassword: "password-123",
    }),
    withParams({}),
  );
  expect(response.status).toBe(201);
  return ((await response.json()) as { student: { id: string } }).student.id;
}

async function billedInstalments(studentId: string) {
  const rows = await prisma.studentInstalment.findMany({ where: { studentId }, orderBy: { sequence: "asc" } });
  return rows.map((row) => ({ sequence: row.sequence, amountMinor: row.amountMinor, dueDate: row.dueDate.toISOString().slice(0, 10) }));
}

describe("Students are billed from their programme", () => {
  test("New student is billed", async () => {
    const id = await newStudent(bscId);

    expect(await billedInstalments(id)).toEqual([
      { sequence: 1, amountMinor: 450_000, dueDate: "2025-10-01" },
      { sequence: 2, amountMinor: 450_000, dueDate: "2026-02-01" },
    ]);
  });

  test("Programme plan changes later", async () => {
    const id = await newStudent(bscId);

    await prisma.programme.update({ where: { id: bscId }, data: { annualFeeMinor: 1_000_000 } });
    await prisma.feePlanInstalment.updateMany({ where: { programmeId: bscId }, data: { amountMinor: 500_000 } });

    expect((await billedInstalments(id)).map((i) => i.amountMinor)).toEqual([450_000, 450_000]);
  });

  test("Changing programme before any payment", async () => {
    const id = await newStudent(bscId);

    const response = await updateStudent(
      jsonRequest("PATCH", `/api/students/${id}`, { programmeId: mscId, academicYear: "2026/27" }),
      withParams({ id }),
    );

    expect(response.status).toBe(200);
    expect(await billedInstalments(id)).toEqual([
      { sequence: 1, amountMinor: 400_000, dueDate: "2026-09-15" },
      { sequence: 2, amountMinor: 400_000, dueDate: "2027-01-15" },
      { sequence: 3, amountMinor: 400_000, dueDate: "2027-05-15" },
    ]);
  });

  test("editing other details does not re-bill", async () => {
    const id = await newStudent(bscId);
    const before = await prisma.studentInstalment.findMany({ where: { studentId: id }, select: { id: true } });

    await updateStudent(jsonRequest("PATCH", `/api/students/${id}`, { fullName: "Renamed" }), withParams({ id }));

    const after = await prisma.studentInstalment.findMany({ where: { studentId: id }, select: { id: true } });
    expect(after).toEqual(before);
  });
});
