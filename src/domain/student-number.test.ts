import { describe, expect, test } from "vitest";
import { formatStudentNumber } from "./student-number";

describe("formatStudentNumber", () => {
  test("First student of an academic year", () => {
    expect(formatStudentNumber(2025, 1)).toBe("SMS-2025-0001");
  });

  test("Next student in the same year", () => {
    expect(formatStudentNumber(2025, 2)).toBe("SMS-2025-0002");
  });

  test("pads to four digits and grows beyond 9999 without losing digits", () => {
    expect(formatStudentNumber(2026, 123)).toBe("SMS-2026-0123");
    expect(formatStudentNumber(2026, 12345)).toBe("SMS-2026-12345");
  });

  test("rejects a sequence that is not a positive whole number", () => {
    expect(() => formatStudentNumber(2026, 0)).toThrow(RangeError);
    expect(() => formatStudentNumber(2026, 1.5)).toThrow(RangeError);
  });
});
