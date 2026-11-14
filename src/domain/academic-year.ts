import type { IsoDate } from "./dates";

/** Academic years run from 1 September to 31 August and are stored as their start year. */
const FIRST_MONTH = 9;

/** "2025/26" → 2025; null unless it is a start year and the next year's last two digits. */
export function parseAcademicYear(text: string): number | null {
  const match = /^(\d{4})\/(\d{2})$/.exec(text.trim());
  if (!match) return null;
  const start = Number(match[1]);
  const endDigits = Number(match[2]);
  return (start + 1) % 100 === endDigits ? start : null;
}

/** 2025 → "2025/26". */
export function formatAcademicYear(startYear: number): string {
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`;
}

/** The start year of the academic year that contains the date. */
export function academicYearOf(date: IsoDate): number {
  const [year, month] = date.split("-").map(Number);
  return month >= FIRST_MONTH ? year : year - 1;
}
