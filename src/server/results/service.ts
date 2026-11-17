import { z } from "zod";
import {
  classify,
  missingGrades,
  parseGrade,
  type ModuleResultCounts,
  RESULT_STATES,
  type Classification,
  type ResultState,
} from "@/domain/results";
import type { EnrolmentStatus } from "@/domain/schemas/student";
import { getAssessmentRoster, type AssessmentRosterRow, type AssessmentView } from "@/server/assessments/service";
import { prisma } from "@/server/db";
import { ConflictError, NotFoundError, ValidationError } from "@/server/http/errors";
import { lockStudent } from "@/server/students/service";

export type GradeView = { value: number; classification: Classification };

const GRADE_MESSAGE = "Enter a whole number from 0 to 100";

const resultStateSchema = z.object({ state: z.enum(RESULT_STATES, "Choose Pending, Published, or Withheld") });

function gradeView(value: number): GradeView {
  return { value, classification: classify(value) };
}

async function resultState(studentId: string, moduleId: string): Promise<ResultState> {
  const row = await prisma.moduleResult.findUnique({
    where: { studentId_moduleId: { studentId, moduleId } },
    select: { state: true },
  });
  return row?.state ?? "PENDING";
}

/** Sets or clears (`grade: null`) one student's grade on one assessment. */
export async function setGrade(
  assessmentId: string,
  studentId: string,
  body: unknown,
): Promise<{ grade: GradeView | null; published: boolean }> {
  const raw = (body as { grade?: unknown } | null)?.grade;
  const clearing = raw === null || raw === "";
  const value = clearing ? null : parseGrade(raw);
  if (!clearing && value === null) throw new ValidationError({ grade: GRADE_MESSAGE });

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { moduleId: true, module: { select: { programmeId: true } } },
  });
  if (!assessment) throw new NotFoundError();

  await prisma.$transaction(async (tx) => {
    const student = await tx.student.findUnique({ where: { id: studentId }, select: { programmeId: true } });
    if (!student || student.programmeId !== assessment.module.programmeId) {
      throw new ValidationError({}, "This student is not on the assessment's programme");
    }
    // Same lock as publishing, so a module cannot be published while one of its grades is being cleared.
    await lockStudent(tx, studentId);
    const key = { assessmentId_studentId: { assessmentId, studentId } };
    if (value === null) await tx.grade.deleteMany({ where: { assessmentId, studentId } });
    else await tx.grade.upsert({ where: key, create: { assessmentId, studentId, value }, update: { value } });
  });

  return {
    grade: value === null ? null : gradeView(value),
    published: (await resultState(studentId, assessment.moduleId)) === "PUBLISHED",
  };
}

/** Publishes, withholds, or returns to Pending one student's results for one module. */
export async function setResultState(studentId: string, moduleId: string, body: unknown): Promise<{ state: ResultState }> {
  const { state } = resultStateSchema.parse(body);

  return prisma.$transaction(async (tx) => {
    const [student, module_] = await Promise.all([
      tx.student.findUnique({ where: { id: studentId }, select: { programmeId: true } }),
      tx.module.findUnique({ where: { id: moduleId }, select: { programmeId: true } }),
    ]);
    if (!student || !module_ || module_.programmeId !== student.programmeId) throw new NotFoundError();
    await lockStudent(tx, studentId);

    if (state === "PUBLISHED") {
      // Read the assessments only after the lock, so one created a moment ago is included.
      const [assessments, graded] = await Promise.all([
        tx.assessment.findMany({ where: { moduleId }, select: { id: true, title: true }, orderBy: { title: "asc" } }),
        tx.grade.findMany({ where: { studentId, assessment: { moduleId } }, select: { assessmentId: true } }),
      ]);
      const missing = missingGrades(assessments, new Set(graded.map((grade) => grade.assessmentId)));
      if (missing === null) {
        throw new ConflictError("incomplete_results", "Results cannot be published yet: this module has no assessments");
      }
      if (missing.length > 0) {
        throw new ConflictError("incomplete_results", `Results cannot be published yet: no grade for ${missing.join(", ")}`);
      }
    }

    const saved = await tx.moduleResult.upsert({
      where: { studentId_moduleId: { studentId, moduleId } },
      create: { studentId, moduleId, state },
      update: { state },
    });
    return { state: saved.state };
  });
}

/** Publishes every student on the module whose results are Pending and complete; everyone else is left as they are. */
export async function publishModule(moduleId: string): Promise<{ published: number; skipped: number; message: string }> {
  return prisma.$transaction(async (tx) => {
    const module_ = await tx.module.findUnique({ where: { id: moduleId }, select: { programmeId: true } });
    if (!module_) throw new NotFoundError();

    // Lock the programme's students so no grade changes underneath the completeness checks,
    // and read the assessments after the lock so one created a moment ago is included.
    await tx.$queryRaw`SELECT id FROM "Student" WHERE "programmeId" = ${module_.programmeId} ORDER BY id FOR UPDATE`;
    const [assessments, students, grades, results] = await Promise.all([
      tx.assessment.findMany({ where: { moduleId }, select: { id: true, title: true } }),
      tx.student.findMany({ where: { programmeId: module_.programmeId }, select: { id: true } }),
      tx.grade.findMany({ where: { assessment: { moduleId } }, select: { studentId: true, assessmentId: true } }),
      tx.moduleResult.findMany({ where: { moduleId }, select: { studentId: true, state: true } }),
    ]);
    const gradedBy = new Map<string, Set<string>>();
    for (const grade of grades) {
      const set = gradedBy.get(grade.studentId) ?? new Set<string>();
      set.add(grade.assessmentId);
      gradedBy.set(grade.studentId, set);
    }
    const stateOf = new Map(results.map((result) => [result.studentId, result.state]));

    const toPublish = students.filter((student) => {
      if ((stateOf.get(student.id) ?? "PENDING") !== "PENDING") return false;
      const missing = missingGrades(assessments, gradedBy.get(student.id) ?? new Set());
      return missing !== null && missing.length === 0;
    });
    for (const student of toPublish) {
      await tx.moduleResult.upsert({
        where: { studentId_moduleId: { studentId: student.id, moduleId } },
        create: { studentId: student.id, moduleId, state: "PUBLISHED" },
        update: { state: "PUBLISHED" },
      });
    }
    const published = toPublish.length;
    const skipped = students.length - published;
    return { published, skipped, message: `${published} published, ${skipped} skipped` };
  });
}

export type StudentModuleResults =
  | { moduleId: string; code: string; title: string; released: false }
  | {
      moduleId: string;
      code: string;
      title: string;
      released: true;
      assessments: { title: string; grade: number; classification: Classification }[];
    };

/**
 * The student's marksheet: every module on their programme, with grades only for Published modules.
 * Grades of Pending and Withheld modules are never read, so they cannot leak.
 */
export async function getStudentResults(studentId: string): Promise<StudentModuleResults[]> {
  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { programmeId: true } });
  if (!student) throw new NotFoundError();
  const [modules, published] = await Promise.all([
    prisma.module.findMany({
      where: { programmeId: student.programmeId },
      orderBy: { code: "asc" },
      select: { id: true, code: true, title: true },
    }),
    prisma.moduleResult.findMany({ where: { studentId, state: "PUBLISHED" }, select: { moduleId: true } }),
  ]);
  const publishedIds = published.map((row) => row.moduleId);
  const grades = await prisma.grade.findMany({
    where: { studentId, assessment: { moduleId: { in: publishedIds } } },
    select: { value: true, assessment: { select: { title: true, moduleId: true } } },
    orderBy: { assessment: { title: "asc" } },
  });

  return modules.map((module_): StudentModuleResults => {
    if (!publishedIds.includes(module_.id)) {
      return { moduleId: module_.id, code: module_.code, title: module_.title, released: false };
    }
    return {
      moduleId: module_.id,
      code: module_.code,
      title: module_.title,
      released: true,
      assessments: grades
        .filter((grade) => grade.assessment.moduleId === module_.id)
        .map((grade) => ({ title: grade.assessment.title, grade: grade.value, classification: classify(grade.value) })),
    };
  });
}

export type MarksheetRow = AssessmentRosterRow & { grade: GradeView | null; resultState: ResultState };

/** The staff marksheet for one assessment: each student's submission, grade, and module result state. */
export async function getAssessmentMarksheet(assessmentId: string): Promise<{ assessment: AssessmentView; rows: MarksheetRow[] }> {
  const { assessment, rows } = await getAssessmentRoster(assessmentId);
  const [grades, results] = await Promise.all([
    prisma.grade.findMany({ where: { assessmentId }, select: { studentId: true, value: true } }),
    prisma.moduleResult.findMany({ where: { moduleId: assessment.module.id }, select: { studentId: true, state: true } }),
  ]);
  const gradeOf = new Map(grades.map((grade) => [grade.studentId, grade.value]));
  const stateOf = new Map(results.map((result) => [result.studentId, result.state]));
  return {
    assessment,
    rows: rows.map((row) => {
      const value = gradeOf.get(row.student.id);
      return { ...row, grade: value === undefined ? null : gradeView(value), resultState: stateOf.get(row.student.id) ?? "PENDING" };
    }),
  };
}

export type ModuleResultsView = {
  module: { id: string; code: string; title: string; programmeName: string };
  assessments: { id: string; title: string }[];
  rows: {
    student: { id: string; studentNumber: string; fullName: string; status: EnrolmentStatus };
    grades: Record<string, GradeView | null>;
    missing: string[];
    state: ResultState;
  }[];
};

/** Every student on a module with their grades, what is missing, and their result state. */
export async function getModuleResults(moduleId: string): Promise<ModuleResultsView> {
  const module_ = await prisma.module.findUnique({
    where: { id: moduleId },
    select: {
      id: true,
      code: true,
      title: true,
      programmeId: true,
      programme: { select: { name: true } },
      assessments: { select: { id: true, title: true }, orderBy: { deadline: "asc" } },
    },
  });
  if (!module_) throw new NotFoundError();
  const [students, grades, results] = await Promise.all([
    prisma.student.findMany({
      where: { programmeId: module_.programmeId },
      orderBy: { fullName: "asc" },
      select: { id: true, studentNumber: true, fullName: true, status: true },
    }),
    prisma.grade.findMany({ where: { assessment: { moduleId } }, select: { studentId: true, assessmentId: true, value: true } }),
    prisma.moduleResult.findMany({ where: { moduleId }, select: { studentId: true, state: true } }),
  ]);
  const stateOf = new Map(results.map((result) => [result.studentId, result.state]));

  return {
    module: { id: module_.id, code: module_.code, title: module_.title, programmeName: module_.programme.name },
    assessments: module_.assessments,
    rows: students.map((student) => {
      const own = grades.filter((grade) => grade.studentId === student.id);
      const byAssessment = Object.fromEntries(
        module_.assessments.map((assessment) => {
          const found = own.find((grade) => grade.assessmentId === assessment.id);
          return [assessment.id, found ? gradeView(found.value) : null];
        }),
      );
      return {
        student,
        grades: byAssessment,
        missing: missingGrades(module_.assessments, new Set(own.map((grade) => grade.assessmentId))) ?? [],
        state: stateOf.get(student.id) ?? "PENDING",
      };
    }),
  };
}

export type ModuleResultSummary = {
  id: string;
  code: string;
  title: string;
  programmeName: string;
  assessmentCount: number;
  counts: ModuleResultCounts;
};

/**
 * Every module, ordered by programme name then code, with how its students' results stand.
 * A Pending result (or no result row yet) is ready when it has a grade for every assessment, as
 * publishing requires, and waiting when a grade is missing. The dashboard's "Results to publish" figure is built on this.
 */
export async function listModuleResultSummaries(): Promise<ModuleResultSummary[]> {
  const [modules, students, grades, results] = await Promise.all([
    prisma.module.findMany({
      orderBy: [{ programme: { name: "asc" } }, { code: "asc" }],
      select: {
        id: true,
        code: true,
        title: true,
        programmeId: true,
        programme: { select: { name: true } },
        assessments: { select: { id: true, title: true } },
      },
    }),
    prisma.student.findMany({ select: { id: true, programmeId: true } }),
    prisma.grade.findMany({ select: { studentId: true, assessmentId: true } }),
    prisma.moduleResult.findMany({ select: { studentId: true, moduleId: true, state: true } }),
  ]);
  const gradedBy = new Map<string, Set<string>>();
  for (const grade of grades) {
    const set = gradedBy.get(grade.studentId) ?? new Set<string>();
    set.add(grade.assessmentId);
    gradedBy.set(grade.studentId, set);
  }
  const stateOf = new Map(results.map((result) => [`${result.studentId}:${result.moduleId}`, result.state]));

  return modules.map((module_) => {
    const counts: ModuleResultCounts = { students: 0, ready: 0, waiting: 0, withheld: 0, published: 0 };
    for (const student of students) {
      if (student.programmeId !== module_.programmeId) continue;
      counts.students += 1;
      const state = stateOf.get(`${student.id}:${module_.id}`) ?? "PENDING";
      if (state === "PUBLISHED") counts.published += 1;
      else if (state === "WITHHELD") counts.withheld += 1;
      else {
        // null when the module has no assessments: nothing to grade, so neither ready nor waiting.
        const missing = missingGrades(module_.assessments, gradedBy.get(student.id) ?? new Set());
        if (missing?.length === 0) counts.ready += 1;
        else if (missing) counts.waiting += 1;
      }
    }
    return {
      id: module_.id,
      code: module_.code,
      title: module_.title,
      programmeName: module_.programme.name,
      assessmentCount: module_.assessments.length,
      counts,
    };
  });
}
