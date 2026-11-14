import { describe, expect, test } from "vitest";
import { decideSubmission, isLate, submissionState } from "./submissions";

const deadline = new Date("2026-12-01T17:00:00Z");
const before = new Date("2026-11-30T12:00:00Z");
const after = new Date("2026-12-02T09:00:00Z");

const open = { isOpen: true, deadline };
const enrolled = "ENROLLED" as const;

describe("decideSubmission", () => {
  test("Valid upload", () => {
    expect(decideSubmission({ assessment: open, status: enrolled, hasSubmission: false, now: before })).toEqual({
      allowed: true,
      action: "create",
    });
  });

  test("Resubmitting before the deadline", () => {
    expect(decideSubmission({ assessment: open, status: enrolled, hasSubmission: true, now: before })).toEqual({
      allowed: true,
      action: "replace",
    });
  });

  test("First submission after the deadline", () => {
    expect(decideSubmission({ assessment: open, status: enrolled, hasSubmission: false, now: after })).toEqual({
      allowed: true,
      action: "create-late",
    });
  });

  test("Resubmitting after the deadline", () => {
    expect(decideSubmission({ assessment: open, status: enrolled, hasSubmission: true, now: after })).toEqual({
      allowed: false,
      reason: "deadline_passed",
    });
  });

  test("exactly at the deadline still counts as on time", () => {
    expect(decideSubmission({ assessment: open, status: enrolled, hasSubmission: true, now: deadline })).toEqual({
      allowed: true,
      action: "replace",
    });
  });

  test("Closed assessment", () => {
    const closed = { isOpen: false, deadline };
    expect(decideSubmission({ assessment: closed, status: enrolled, hasSubmission: false, now: before })).toEqual({
      allowed: false,
      reason: "closed",
    });
  });

  test("Student not currently enrolled", () => {
    for (const status of ["DEFERRED", "WITHDRAWN", "COMPLETED"] as const) {
      expect(decideSubmission({ assessment: open, status, hasSubmission: false, now: before })).toEqual({
        allowed: false,
        reason: "not_enrolled",
      });
    }
  });
});

describe("isLate", () => {
  test("a submission after the deadline is late, and one at or before it is not", () => {
    expect(isLate(after, deadline)).toBe(true);
    expect(isLate(deadline, deadline)).toBe(false);
    expect(isLate(before, deadline)).toBe(false);
  });

  test("Deadline extended after a late submission", () => {
    const extended = new Date("2026-12-05T17:00:00Z");
    expect(isLate(after, extended)).toBe(false);
  });
});

describe("submissionState", () => {
  test("not submitted, on time, or late", () => {
    expect(submissionState(null, deadline)).toBe("missing");
    expect(submissionState(before, deadline)).toBe("on-time");
    expect(submissionState(after, deadline)).toBe("late");
  });
});
