import { z } from "zod";
import { localDateTimeToUtc } from "../dates";

/**
 * A deadline as staff enter it: a local date-time ("2026-12-01T17:00") in the app's time zone,
 * or a full ISO timestamp with a zone ("2026-12-01T17:00:00Z").
 */
function deadlineField(timeZone: string) {
  return z
    .string("Enter the deadline")
    .transform((value) => {
      const trimmed = value.trim();
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) return localDateTimeToUtc(trimmed, timeZone);
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(trimmed)) {
        const date = new Date(trimmed);
        return Number.isNaN(date.getTime()) ? null : date;
      }
      return null;
    })
    .refine((date) => date !== null, "Enter the deadline date and time")
    .transform((date) => date as Date);
}

const title = z.string("Enter a title").trim().min(1, "Enter a title").max(200, "Use 200 characters or fewer");

export function createAssessmentSchema(now: Date, timeZone: string) {
  return z.object({
    title,
    moduleId: z.string("Choose a module").min(1, "Choose a module"),
    deadline: deadlineField(timeZone).refine((date) => date.getTime() > now.getTime(), "The deadline must be in the future"),
  });
}

/** Staff may change the title and deadline, and close or reopen the assessment. */
export function updateAssessmentSchema(timeZone: string) {
  return z
    .object({
      title,
      deadline: deadlineField(timeZone),
      isOpen: z.boolean("Choose open or closed"),
    })
    .partial();
}

export const MAX_SUBMISSION_BYTES = 10 * 1024 * 1024;

export const SUBMISSION_TYPES = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
} as const;
