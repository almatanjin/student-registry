import { describe, expect, test } from "vitest";
import { deadlineCountdown } from "./deadlines";

const LONDON = "Europe/London";

describe("deadlineCountdown", () => {
  test("Future deadline", () => {
    expect(deadlineCountdown(new Date("2026-11-27T17:00:00Z"), "2026-11-17", LONDON)).toBe("In 10 days");
  });

  test("Deadline tomorrow", () => {
    expect(deadlineCountdown(new Date("2026-11-18T17:00:00Z"), "2026-11-17", LONDON)).toBe("Due tomorrow");
  });

  test("Deadline today, later today", () => {
    expect(deadlineCountdown(new Date("2026-11-17T17:00:00Z"), "2026-11-17", LONDON)).toBe("Due today");
  });

  test("Deadline today, earlier today", () => {
    expect(deadlineCountdown(new Date("2026-11-17T09:00:00Z"), "2026-11-17", LONDON)).toBe("Due today");
  });

  test("Deadline yesterday", () => {
    expect(deadlineCountdown(new Date("2026-11-16T17:00:00Z"), "2026-11-17", LONDON)).toBe("1 day ago");
  });

  test("a late-evening UTC deadline counts on the next calendar day in the app time zone", () => {
    // 23:30 UTC on 30 June is 00:30 on 1 July in London (BST).
    expect(deadlineCountdown(new Date("2026-06-30T23:30:00Z"), "2026-06-30", LONDON)).toBe("Due tomorrow");
  });

  test("Past deadline", () => {
    expect(deadlineCountdown(new Date("2026-11-10T17:00:00Z"), "2026-11-17", LONDON)).toBe("7 days ago");
  });
});
