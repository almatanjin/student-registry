import { describe, expect, test } from "vitest";
import { localDateTimeToUtc, todayIn, utcToLocalDateTime } from "./dates";

describe("todayIn", () => {
  test("late evening in winter is still the same day in London (GMT)", () => {
    expect(todayIn("Europe/London", new Date("2026-01-15T23:30:00Z"))).toBe("2026-01-15");
  });

  test("late evening UTC in summer is already the next day in London (BST)", () => {
    expect(todayIn("Europe/London", new Date("2026-06-30T23:30:00Z"))).toBe("2026-07-01");
  });

  test("the same instant gives a different date in a zone ahead of UTC", () => {
    expect(todayIn("Asia/Dhaka", new Date("2026-01-15T19:00:00Z"))).toBe("2026-01-16");
  });

  test("an unknown time zone is rejected", () => {
    expect(() => todayIn("Mars/Olympus", new Date())).toThrow(RangeError);
  });
});

describe("localDateTimeToUtc", () => {
  test("winter time in London is UTC", () => {
    expect(localDateTimeToUtc("2026-12-01T17:00", "Europe/London")?.toISOString()).toBe("2026-12-01T17:00:00.000Z");
  });

  test("summer time in London is one hour ahead of UTC", () => {
    expect(localDateTimeToUtc("2026-06-15T09:30", "Europe/London")?.toISOString()).toBe("2026-06-15T08:30:00.000Z");
  });

  test("works for a zone ahead of UTC", () => {
    expect(localDateTimeToUtc("2026-12-01T17:00", "Asia/Dhaka")?.toISOString()).toBe("2026-12-01T11:00:00.000Z");
  });

  test("returns null for text that is not a local date and time", () => {
    for (const bad of ["2026-12-01", "tomorrow", "2026-13-01T10:00", "2026-12-01T25:00"]) {
      expect(localDateTimeToUtc(bad, "Europe/London"), bad).toBeNull();
    }
  });
});

describe("utcToLocalDateTime", () => {
  test("shows a UTC instant as a local date and time for a datetime input", () => {
    expect(utcToLocalDateTime(new Date("2026-06-15T08:30:00Z"), "Europe/London")).toBe("2026-06-15T09:30");
    expect(utcToLocalDateTime(new Date("2026-12-01T17:00:00Z"), "Europe/London")).toBe("2026-12-01T17:00");
  });
});
