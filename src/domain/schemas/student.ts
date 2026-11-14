import { z } from "zod";
import { parseAcademicYear } from "../academic-year";
import type { IsoDate } from "../dates";

export const ENROLMENT_STATUSES = ["ENROLLED", "DEFERRED", "WITHDRAWN", "COMPLETED"] as const;
export type EnrolmentStatus = (typeof ENROLMENT_STATUSES)[number];

export const STATUS_LABELS: Record<EnrolmentStatus, string> = {
  ENROLLED: "Enrolled",
  DEFERRED: "Deferred",
  WITHDRAWN: "Withdrawn",
  COMPLETED: "Completed",
};

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Field rules shared by the create and edit forms and the API. `today` decides what counts as the past. */
function studentFields(today: IsoDate) {
  return {
    fullName: z.string("Enter the full name").trim().min(1, "Enter the full name").max(200, "Use 200 characters or fewer"),
    email: z
      .string("Enter an email address")
      .trim()
      .toLowerCase()
      .pipe(z.email("Enter a valid email address")),
    dateOfBirth: z
      .string("Enter the date of birth")
      .regex(isoDate, "Enter the date of birth")
      .refine(isRealDate, "Enter a real date")
      .refine((value) => value < today, "Date of birth must be in the past"),
    programmeId: z.string("Choose a programme").min(1, "Choose a programme"),
    academicYear: z
      .string("Enter the academic year")
      .refine((value) => parseAcademicYear(value) !== null, "Use the form 2025/26")
      .transform((value) => parseAcademicYear(value) as number),
    status: z.enum(ENROLMENT_STATUSES, "Choose an enrolment status"),
  };
}

export function createStudentSchema(today: IsoDate) {
  return z.object({
    ...studentFields(today),
    initialPassword: z
      .string("Enter an initial password")
      .min(8, "Use at least 8 characters")
      .max(200, "Use 200 characters or fewer"),
  });
}

/** Edits send only the fields that change. The Student ID and password are never editable here. */
export function updateStudentSchema(today: IsoDate) {
  return z.object(studentFields(today)).partial();
}

export type CreateStudentInput = z.infer<ReturnType<typeof createStudentSchema>>;
export type UpdateStudentInput = z.infer<ReturnType<typeof updateStudentSchema>>;

export const studentListQuerySchema = z.object({
  q: z.string().trim().max(200).optional().transform((value) => value || undefined),
  programmeId: z.string().optional().transform((value) => value || undefined),
  status: z.enum(ENROLMENT_STATUSES, "Choose an enrolment status").optional().or(z.literal("").transform(() => undefined)),
});

export type StudentListQuery = z.infer<typeof studentListQuerySchema>;
