import { describe, expect, test } from "vitest";
import { academicYearOf, formatAcademicYear, parseAcademicYear } from "./academic-year";

describe("parseAcademicYear", () => {
  test("reads a start and end year one apart", () => {
    expect(parseAcademicYear("2025/26")).toBe(2025);
    expect(parseAcademicYear(" 2030/31 ")).toBe(2030);
  });

  test("handles the turn of a century", () => {
    expect(parseAcademicYear("2099/00")).toBe(2099);
  });

  test("Malformed academic year", () => {
    for (const bad of ["2025/27", "2025", "2025/2026", "25/26", "2025-26", "abcd/ef", ""]) {
      expect(parseAcademicYear(bad), bad).toBeNull();
    }
  });
});

describe("formatAcademicYear", () => {
  test("shows the start year and the last two digits of the end year", () => {
    expect(formatAcademicYear(2025)).toBe("2025/26");
    expect(formatAcademicYear(2099)).toBe("2099/00");
  });
});

describe("academicYearOf", () => {
  test("an academic year starts on 1 September", () => {
    expect(academicYearOf("2026-08-31")).toBe(2025);
    expect(academicYearOf("2026-09-01")).toBe(2026);
    expect(academicYearOf("2027-01-15")).toBe(2026);
  });
});
