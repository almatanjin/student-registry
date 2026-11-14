import { describe, expect, test } from "vitest";
import { calculateBalance, datePlanInstalments, type BilledInstalment } from "./fees";

describe("datePlanInstalments", () => {
  const plan = [
    { sequence: 1, amountMinor: 450_000, dueMonth: 10, dueDay: 1 },
    { sequence: 2, amountMinor: 450_000, dueMonth: 2, dueDay: 1 },
  ];

  test("New student is billed", () => {
    expect(datePlanInstalments(plan, 2025)).toEqual([
      { sequence: 1, amountMinor: 450_000, dueDate: "2025-10-01" },
      { sequence: 2, amountMinor: 450_000, dueDate: "2026-02-01" },
    ]);
  });

  test("September to December fall in the start year and January to August in the end year", () => {
    const edges = [
      { sequence: 1, amountMinor: 1, dueMonth: 9, dueDay: 1 },
      { sequence: 2, amountMinor: 1, dueMonth: 12, dueDay: 31 },
      { sequence: 3, amountMinor: 1, dueMonth: 1, dueDay: 1 },
      { sequence: 4, amountMinor: 1, dueMonth: 8, dueDay: 31 },
    ];

    expect(datePlanInstalments(edges, 2026).map((i) => i.dueDate)).toEqual([
      "2026-09-01",
      "2026-12-31",
      "2027-01-01",
      "2027-08-31",
    ]);
  });

  test("returns the instalments in due-date order", () => {
    const outOfOrder = [plan[1], plan[0]];

    expect(datePlanInstalments(outOfOrder, 2025).map((i) => i.sequence)).toEqual([1, 2]);
  });

  test("a 29 February due date falls on 28 February in a non-leap year", () => {
    const leap = [{ sequence: 1, amountMinor: 1, dueMonth: 2, dueDay: 29 }];

    expect(datePlanInstalments(leap, 2026)[0].dueDate).toBe("2027-02-28");
    expect(datePlanInstalments(leap, 2027)[0].dueDate).toBe("2028-02-29");
  });
});

describe("calculateBalance", () => {
  const twoHalves: BilledInstalment[] = [
    { sequence: 1, amountMinor: 450_000, dueDate: "2025-10-01" },
    { sequence: 2, amountMinor: 450_000, dueDate: "2026-02-01" },
  ];

  test("Instalment falls due", () => {
    const balance = calculateBalance(twoHalves, 300_000, "2025-11-14");

    expect(balance).toMatchObject({
      totalMinor: 900_000,
      paidMinor: 300_000,
      outstandingMinor: 600_000,
      dueToDateMinor: 450_000,
      overdueMinor: 150_000,
      earliestUnpaidDueDate: "2025-10-01",
    });
  });

  test("Due date is today", () => {
    const balance = calculateBalance(twoHalves, 0, "2025-10-01");

    expect(balance.dueToDateMinor).toBe(0);
    expect(balance.overdueMinor).toBe(0);
    expect(balance.instalments[0].state).toBe("upcoming");
  });

  test("the day after the due date it is overdue", () => {
    const balance = calculateBalance(twoHalves, 0, "2025-10-02");

    expect(balance.overdueMinor).toBe(450_000);
    expect(balance.instalments[0].state).toBe("overdue");
  });

  test("Paying off in full", () => {
    const balance = calculateBalance(twoHalves, 900_000, "2026-06-01");

    expect(balance).toMatchObject({ outstandingMinor: 0, overdueMinor: 0, earliestUnpaidDueDate: null });
    expect(balance.instalments.map((i) => i.state)).toEqual(["paid", "paid"]);
  });

  test("paying ahead of the due dates never shows a negative overdue amount", () => {
    const balance = calculateBalance(twoHalves, 600_000, "2025-11-14");

    expect(balance.overdueMinor).toBe(0);
    expect(balance.outstandingMinor).toBe(300_000);
  });

  test("Instalment states", () => {
    const three: BilledInstalment[] = [
      { sequence: 1, amountMinor: 300_000, dueDate: "2025-10-01" },
      { sequence: 2, amountMinor: 300_000, dueDate: "2026-01-15" },
      { sequence: 3, amountMinor: 300_000, dueDate: "2026-04-15" },
    ];

    const balance = calculateBalance(three, 300_000, "2026-02-01");

    expect(balance.instalments.map((i) => i.state)).toEqual(["paid", "overdue", "upcoming"]);
    expect(balance.earliestUnpaidDueDate).toBe("2026-01-15");
  });

  test("a part-paid instalment shows how much of it is still owed", () => {
    const balance = calculateBalance(twoHalves, 100_000, "2025-11-14");

    expect(balance.instalments[0]).toMatchObject({ state: "overdue", paidMinor: 100_000, remainingMinor: 350_000 });
    expect(balance.instalments[1]).toMatchObject({ state: "upcoming", paidMinor: 0, remainingMinor: 450_000 });
  });

  test("payments are applied in due-date order even when instalments arrive unsorted", () => {
    const balance = calculateBalance([twoHalves[1], twoHalves[0]], 450_000, "2026-03-01");

    expect(balance.instalments.map((i) => [i.sequence, i.state])).toEqual([
      [1, "paid"],
      [2, "overdue"],
    ]);
  });

  test("a student with no instalments owes nothing", () => {
    expect(calculateBalance([], 0, "2026-01-01")).toMatchObject({
      totalMinor: 0,
      outstandingMinor: 0,
      overdueMinor: 0,
      earliestUnpaidDueDate: null,
    });
  });
});
