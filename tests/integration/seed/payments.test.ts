import { describe, expect, test } from "vitest";
import { prisma } from "@/server/db";
import { getStudentFees } from "@/server/fees/service";
import { listOverdueStudents } from "@/server/fees/overdue";
import { runSeed } from "../../../prisma/seed/index";

const PASSWORD = "seed-test-password";

async function feesByName(on: string) {
  const students = await prisma.student.findMany({ select: { id: true, fullName: true } });
  const entries = await Promise.all(students.map(async (s) => [s.fullName, await getStudentFees(s.id, on)] as const));
  return Object.fromEntries(entries);
}

// The seed must give the same demo picture whatever day it runs on.
describe.each(["2026-11-14", "2026-09-03", "2027-02-20", "2027-06-30"])("seeded payments on %s", (today) => {
  test("at least one student is overdue, one fully paid, and one part-paid but not overdue", async () => {
    await runSeed(prisma, { today, password: PASSWORD });
    const fees = await feesByName(today);

    expect(fees["Amara Okafor"]).toMatchObject({ outstandingMinor: 0 });
    expect(fees["Daniel Mensah"]).toMatchObject({ outstandingMinor: 0 });
    expect(fees["Liam Chen"].paidMinor).toBeGreaterThan(0);
    expect(fees["Liam Chen"].outstandingMinor).toBeGreaterThan(0);
    expect(fees["Liam Chen"].overdueMinor).toBe(0);
    expect(fees["Sofia Rossi"].overdueMinor).toBeGreaterThan(0);
    expect(fees["Fatima Hassan"].overdueMinor).toBeGreaterThan(0);

    const payments = await prisma.payment.findMany({ select: { paidOn: true } });
    for (const payment of payments) expect(payment.paidOn.toISOString().slice(0, 10) <= today).toBe(true);
  });
});

test("the overdue query returns exactly the expected seeded students on 14 November 2026", async () => {
  await runSeed(prisma, { today: "2026-11-14", password: PASSWORD });

  const overdue = await listOverdueStudents("2026-11-14");

  // Highest overdue amount first; equal amounts show the longest-overdue student first.
  expect(overdue.map((entry) => [entry.fullName, entry.overdueMinor, entry.earliestUnpaidDueDate])).toEqual([
    ["Fatima Hassan", 600_000, "2026-01-15"],
    ["Sofia Rossi", 600_000, "2026-02-01"],
    ["Noah Williams", 600_000, "2026-10-01"],
    ["Priya Patel", 300_000, "2026-10-01"],
  ]);
  expect(overdue[0]).toMatchObject({ status: "WITHDRAWN", programmeName: "BSc (Hons) Computer Science" });
});
