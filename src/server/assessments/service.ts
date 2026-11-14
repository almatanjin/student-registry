import type { Prisma } from "@/generated/prisma/client";
import { createAssessmentSchema, updateAssessmentSchema } from "@/domain/schemas/assessment";
import type { EnrolmentStatus } from "@/domain/schemas/student";
import { decideSubmission, submissionState, type SubmissionState } from "@/domain/submissions";
import { appTimeZone } from "@/server/config";
import { prisma } from "@/server/db";
import { NotFoundError, ValidationError } from "@/server/http/errors";

export type AssessmentView = {
  id: string;
  title: string;
  deadline: string;
  /** Whether the deadline had passed when the data was loaded. */
  deadlinePassed: boolean;
  isOpen: boolean;
  module: { id: string; code: string; title: string; programmeId: string; programmeName: string };
};

export type SubmissionSummary = {
  id: string;
  originalName: string;
  sizeBytes: number;
  submittedAt: string;
  state: Exclude<SubmissionState, "missing">;
};

export type StaffAssessmentListItem = AssessmentView & { counts: { onTime: number; late: number; missing: number } };

export type StudentAssessmentListItem = AssessmentView & {
  submission: { state: SubmissionState; detail: SubmissionSummary | null };
};

export type AssessmentRosterRow = {
  student: { id: string; studentNumber: string; fullName: string; status: EnrolmentStatus };
  submission: SubmissionSummary | null;
};

const assessmentSelect = {
  id: true,
  title: true,
  deadline: true,
  isOpen: true,
  module: { select: { id: true, code: true, title: true, programme: { select: { id: true, name: true } } } },
} satisfies Prisma.AssessmentSelect;

type AssessmentRow = Prisma.AssessmentGetPayload<{ select: typeof assessmentSelect }>;

function toView(row: AssessmentRow): AssessmentView {
  return {
    id: row.id,
    title: row.title,
    deadline: row.deadline.toISOString(),
    deadlinePassed: row.deadline.getTime() < Date.now(),
    isOpen: row.isOpen,
    module: {
      id: row.module.id,
      code: row.module.code,
      title: row.module.title,
      programmeId: row.module.programme.id,
      programmeName: row.module.programme.name,
    },
  };
}

export function toSubmissionSummary(
  submission: { id: string; originalName: string; sizeBytes: number; submittedAt: Date },
  deadline: Date,
): SubmissionSummary {
  return {
    id: submission.id,
    originalName: submission.originalName,
    sizeBytes: submission.sizeBytes,
    submittedAt: submission.submittedAt.toISOString(),
    state: submissionState(submission.submittedAt, deadline) as "on-time" | "late",
  };
}

const byDeadline = { deadline: "asc" } as const;

export async function createAssessment(body: unknown): Promise<AssessmentView> {
  const input = createAssessmentSchema(new Date(), appTimeZone()).parse(body);
  const moduleRow = await prisma.module.findUnique({ where: { id: input.moduleId }, select: { id: true } });
  if (!moduleRow) throw new ValidationError({ moduleId: "Choose a module" });
  const row = await prisma.assessment.create({
    data: { title: input.title, moduleId: input.moduleId, deadline: input.deadline },
    select: assessmentSelect,
  });
  return toView(row);
}

export async function updateAssessment(id: string, body: unknown): Promise<AssessmentView> {
  const input = updateAssessmentSchema(appTimeZone()).parse(body);
  const existing = await prisma.assessment.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new NotFoundError();
  const row = await prisma.assessment.update({
    where: { id },
    data: { title: input.title, deadline: input.deadline, isOpen: input.isOpen },
    select: assessmentSelect,
  });
  return toView(row);
}

export async function getAssessment(id: string): Promise<AssessmentView> {
  const row = await prisma.assessment.findUnique({ where: { id }, select: assessmentSelect });
  if (!row) throw new NotFoundError();
  return toView(row);
}

/** Every assessment with on-time, late, and missing counts across the students on its programme. */
export async function listAssessmentsForStaff(): Promise<StaffAssessmentListItem[]> {
  const [rows, studentsPerProgramme] = await Promise.all([
    prisma.assessment.findMany({
      orderBy: byDeadline,
      select: { ...assessmentSelect, submissions: { select: { submittedAt: true } } },
    }),
    prisma.student.groupBy({ by: ["programmeId"], _count: { _all: true } }),
  ]);
  const studentCount = new Map(studentsPerProgramme.map((row) => [row.programmeId, row._count._all]));

  return rows.map((row) => {
    const late = row.submissions.filter((s) => submissionState(s.submittedAt, row.deadline) === "late").length;
    const onTime = row.submissions.length - late;
    const total = studentCount.get(row.module.programme.id) ?? 0;
    return { ...toView(row), counts: { onTime, late, missing: Math.max(0, total - row.submissions.length) } };
  });
}

/** The assessments of the student's programme, each with the student's own submission state. */
export async function listAssessmentsForStudent(studentId: string): Promise<StudentAssessmentListItem[]> {
  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { programmeId: true } });
  if (!student) throw new NotFoundError();
  const rows = await prisma.assessment.findMany({
    where: { module: { programmeId: student.programmeId } },
    orderBy: byDeadline,
    select: {
      ...assessmentSelect,
      submissions: {
        where: { studentId },
        select: { id: true, originalName: true, sizeBytes: true, submittedAt: true },
      },
    },
  });
  return rows.map((row) => {
    const own = row.submissions[0] ? toSubmissionSummary(row.submissions[0], row.deadline) : null;
    return { ...toView(row), submission: { state: own?.state ?? "missing", detail: own } };
  });
}

/** Every student on the assessment's programme with their submission, for the staff view and marksheet. */
export async function getAssessmentRoster(id: string): Promise<{ assessment: AssessmentView; rows: AssessmentRosterRow[] }> {
  const assessment = await getAssessment(id);
  const [students, submissions] = await Promise.all([
    prisma.student.findMany({
      where: { programmeId: assessment.module.programmeId },
      orderBy: { fullName: "asc" },
      select: { id: true, studentNumber: true, fullName: true, status: true },
    }),
    prisma.submission.findMany({
      where: { assessmentId: id },
      select: { id: true, studentId: true, originalName: true, sizeBytes: true, submittedAt: true },
    }),
  ]);
  const deadline = new Date(assessment.deadline);
  const byStudent = new Map(submissions.map((submission) => [submission.studentId, submission]));
  return {
    assessment,
    rows: students.map((student) => {
      const submission = byStudent.get(student.id);
      return { student, submission: submission ? toSubmissionSummary(submission, deadline) : null };
    }),
  };
}

/** Modules for the assessment form, grouped by programme name. */
export function listModuleOptions() {
  return prisma.module.findMany({
    orderBy: [{ programme: { name: "asc" } }, { code: "asc" }],
    select: { id: true, code: true, title: true, programme: { select: { name: true } } },
  });
}

export type StudentAssessmentDetail = StudentAssessmentListItem & {
  /** What happens if the student uploads now, worked out with the same rules the upload uses. */
  upload: ReturnType<typeof decideSubmission>;
};

/** One assessment from the student's own programme, with their submission and whether they can upload now. */
export async function getAssessmentForStudent(id: string, studentId: string): Promise<StudentAssessmentDetail> {
  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { programmeId: true, status: true } });
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    select: {
      ...assessmentSelect,
      submissions: { where: { studentId }, select: { id: true, originalName: true, sizeBytes: true, submittedAt: true } },
    },
  });
  if (!student || !assessment || assessment.module.programme.id !== student.programmeId) throw new NotFoundError();
  const own = assessment.submissions[0] ? toSubmissionSummary(assessment.submissions[0], assessment.deadline) : null;
  return {
    ...toView(assessment),
    submission: { state: own?.state ?? "missing", detail: own },
    upload: decideSubmission({ assessment, status: student.status, hasSubmission: Boolean(own), now: new Date() }),
  };
}
