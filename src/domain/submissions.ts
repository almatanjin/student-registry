import type { EnrolmentStatus } from "./schemas/student";

export type SubmissionAction = "create" | "replace" | "create-late";
export type RefusalReason = "closed" | "not_enrolled" | "deadline_passed";

export type SubmissionDecision = { allowed: true; action: SubmissionAction } | { allowed: false; reason: RefusalReason };

export type SubmissionState = "missing" | "on-time" | "late";

/** A submission is late when it arrives after the deadline; exactly at the deadline is on time. */
export function isLate(submittedAt: Date, deadline: Date): boolean {
  return submittedAt.getTime() > deadline.getTime();
}

export function submissionState(submittedAt: Date | null, deadline: Date): SubmissionState {
  if (!submittedAt) return "missing";
  return isLate(submittedAt, deadline) ? "late" : "on-time";
}

/**
 * Whether a student may upload now, and what the upload does:
 * only Enrolled students may submit, only to an open assessment;
 * before the deadline a new upload replaces the old one;
 * after it a first submission is accepted as late, but an existing one can no longer be replaced.
 */
export function decideSubmission(input: {
  assessment: { isOpen: boolean; deadline: Date };
  status: EnrolmentStatus;
  hasSubmission: boolean;
  now: Date;
}): SubmissionDecision {
  if (input.status !== "ENROLLED") return { allowed: false, reason: "not_enrolled" };
  if (!input.assessment.isOpen) return { allowed: false, reason: "closed" };
  const pastDeadline = isLate(input.now, input.assessment.deadline);
  if (!input.hasSubmission) return { allowed: true, action: pastDeadline ? "create-late" : "create" };
  if (pastDeadline) return { allowed: false, reason: "deadline_passed" };
  return { allowed: true, action: "replace" };
}
