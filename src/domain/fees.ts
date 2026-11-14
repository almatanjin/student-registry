import type { IsoDate } from "./dates";

/** One instalment of a programme's fee plan, dated by month and day within an academic year. */
export type PlanInstalment = { sequence: number; amountMinor: number; dueMonth: number; dueDay: number };

/** One instalment billed to a student, with a real due date. */
export type BilledInstalment = { sequence: number; amountMinor: number; dueDate: IsoDate };

export type InstalmentState = "paid" | "overdue" | "upcoming";

export type InstalmentStatus = BilledInstalment & {
  state: InstalmentState;
  /** Part of this instalment covered by payments, applied in due-date order. */
  paidMinor: number;
  remainingMinor: number;
};

export type Balance = {
  totalMinor: number;
  paidMinor: number;
  outstandingMinor: number;
  /** Sum of instalments whose due date is before today. */
  dueToDateMinor: number;
  overdueMinor: number;
  /** Due date of the first instalment not yet fully paid, or null when everything is paid. */
  earliestUnpaidDueDate: IsoDate | null;
  instalments: InstalmentStatus[];
};

/** Academic years start in September: September-December fall in the start year, January-August in the next. */
const FIRST_MONTH_OF_YEAR = 9;

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Turns a programme's plan into dated instalments for one academic year, in due-date order. */
export function datePlanInstalments(plan: PlanInstalment[], academicYearStart: number): BilledInstalment[] {
  return plan
    .map((instalment) => {
      const year = instalment.dueMonth >= FIRST_MONTH_OF_YEAR ? academicYearStart : academicYearStart + 1;
      // A day past the end of the month (29 February in a common year) falls on the month's last day.
      const day = Math.min(instalment.dueDay, lastDayOfMonth(year, instalment.dueMonth));
      return {
        sequence: instalment.sequence,
        amountMinor: instalment.amountMinor,
        dueDate: `${year}-${pad(instalment.dueMonth)}-${pad(day)}`,
      };
    })
    .sort(byDueDate);
}

function byDueDate(a: BilledInstalment, b: BilledInstalment): number {
  return a.dueDate.localeCompare(b.dueDate) || a.sequence - b.sequence;
}

/**
 * The student's balance on `today`, computed from the billed instalments and the total paid.
 * An instalment counts as due only after its due date. Payments cover instalments in due-date order.
 */
export function calculateBalance(instalments: BilledInstalment[], paidMinor: number, today: IsoDate): Balance {
  const ordered = [...instalments].sort(byDueDate);
  const totalMinor = ordered.reduce((sum, instalment) => sum + instalment.amountMinor, 0);
  const dueToDateMinor = ordered
    .filter((instalment) => instalment.dueDate < today)
    .reduce((sum, instalment) => sum + instalment.amountMinor, 0);

  let unallocated = paidMinor;
  const statuses = ordered.map((instalment): InstalmentStatus => {
    const covered = Math.min(unallocated, instalment.amountMinor);
    unallocated -= covered;
    const remainingMinor = instalment.amountMinor - covered;
    const state: InstalmentState =
      remainingMinor === 0 ? "paid" : instalment.dueDate < today ? "overdue" : "upcoming";
    return { ...instalment, state, paidMinor: covered, remainingMinor };
  });

  return {
    totalMinor,
    paidMinor,
    outstandingMinor: totalMinor - paidMinor,
    dueToDateMinor,
    overdueMinor: Math.max(0, dueToDateMinor - paidMinor),
    earliestUnpaidDueDate: statuses.find((instalment) => instalment.state !== "paid")?.dueDate ?? null,
    instalments: statuses,
  };
}
