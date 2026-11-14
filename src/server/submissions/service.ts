import { fileTypeFromBuffer } from "file-type";
import { MAX_SUBMISSION_BYTES, SUBMISSION_TYPES } from "@/domain/schemas/assessment";
import { decideSubmission, type RefusalReason } from "@/domain/submissions";
import { toSubmissionSummary, type SubmissionSummary } from "@/server/assessments/service";
import type { CurrentUser } from "@/server/auth/types";
import { prisma } from "@/server/db";
import { ConflictError, NotFoundError, PayloadTooLargeError, ValidationError } from "@/server/http/errors";
import { fileStorage } from "@/server/storage";
import { lockStudent } from "@/server/students/service";

const EXTENSION_FOR: Record<keyof typeof SUBMISSION_TYPES, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

const REFUSALS: Record<RefusalReason, ConflictError> = {
  closed: new ConflictError("assessment_closed", "This assessment is closed"),
  not_enrolled: new ConflictError("not_enrolled", "Only enrolled students can submit work"),
  deadline_passed: new ConflictError(
    "deadline_passed",
    "The deadline has passed, so your submission can no longer be replaced",
  ),
};

const WRONG_TYPE = "Upload a PDF or DOCX file";

/** Keeps only the file's own name (no folders), trimmed to a sensible length. */
function cleanFileName(name: string): string {
  const base = name.split(/[\\/]/).pop()?.trim() || "submission";
  return base.slice(0, 200);
}

/** Checks the file by its content and its name; returns the detected type. */
async function checkFile(file: File): Promise<{ bytes: Uint8Array; mimeType: keyof typeof SUBMISSION_TYPES; name: string }> {
  if (file.size === 0) throw new ValidationError({ file: "The file is empty" });
  if (file.size > MAX_SUBMISSION_BYTES) throw new PayloadTooLargeError("The file is larger than 10 MB", "file");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = (await fileTypeFromBuffer(bytes))?.mime;
  const name = cleanFileName(file.name);
  if (!detected || !(detected in SUBMISSION_TYPES)) throw new ValidationError({ file: WRONG_TYPE });
  const mimeType = detected as keyof typeof SUBMISSION_TYPES;
  if (!name.toLowerCase().endsWith(EXTENSION_FOR[mimeType])) throw new ValidationError({ file: WRONG_TYPE });
  return { bytes, mimeType, name };
}

/** The uploaded file from a multipart request, refusing obviously oversized bodies before reading them. */
export async function readUpload(request: Request): Promise<File> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_SUBMISSION_BYTES + 1024 * 1024) {
    throw new PayloadTooLargeError("The file is larger than 10 MB", "file");
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new ValidationError({ file: "Choose a file to upload" });
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw new ValidationError({ file: "Choose a file to upload" });
  return file;
}

/**
 * Saves a student's submission. The file is stored first; the decision and the database change
 * then happen under the student's row lock, so simultaneous uploads are handled one at a time.
 * The replaced file (or the new one, if the upload is refused) is removed afterwards.
 */
export async function submitFile(assessmentId: string, studentId: string, file: File): Promise<SubmissionSummary> {
  const checked = await checkFile(file);
  const storage = fileStorage();
  const storageKey = await storage.put(checked.bytes);

  let replacedKey: string | null = null;
  try {
    const result = await prisma.$transaction(async (tx) => {
      await lockStudent(tx, studentId);
      const [student, assessment] = await Promise.all([
        tx.student.findUnique({ where: { id: studentId }, select: { status: true, programmeId: true } }),
        tx.assessment.findUnique({
          where: { id: assessmentId },
          select: { isOpen: true, deadline: true, module: { select: { programmeId: true } } },
        }),
      ]);
      if (!student || !assessment || assessment.module.programmeId !== student.programmeId) throw new NotFoundError();

      const existing = await tx.submission.findUnique({
        where: { assessmentId_studentId: { assessmentId, studentId } },
        select: { storageKey: true },
      });
      const now = new Date();
      const decision = decideSubmission({ assessment, status: student.status, hasSubmission: Boolean(existing), now });
      if (!decision.allowed) throw REFUSALS[decision.reason];

      const data = {
        storageKey,
        originalName: checked.name,
        mimeType: checked.mimeType,
        sizeBytes: checked.bytes.byteLength,
        submittedAt: now,
      };
      const saved = await tx.submission.upsert({
        where: { assessmentId_studentId: { assessmentId, studentId } },
        create: { assessmentId, studentId, ...data },
        update: data,
      });
      replacedKey = existing?.storageKey ?? null;
      return toSubmissionSummary(saved, assessment.deadline);
    });
    if (replacedKey) await removeQuietly(replacedKey);
    return result;
  } catch (error) {
    await removeQuietly(storageKey);
    throw error;
  }
}

async function removeQuietly(key: string) {
  try {
    await fileStorage().remove(key);
  } catch (error) {
    // The database is already correct; an orphaned file only wastes space.
    console.error(`Could not remove stored file ${key}`, error);
  }
}

/** A submitted file, for staff or for the student who submitted it; anyone else gets 404. */
export async function readSubmissionFile(submissionId: string, user: CurrentUser) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { studentId: true, storageKey: true, originalName: true, mimeType: true },
  });
  if (!submission) throw new NotFoundError();
  if (user.role !== "STAFF" && user.studentId !== submission.studentId) throw new NotFoundError();
  const bytes = await fileStorage().read(submission.storageKey);
  return { bytes, name: submission.originalName, mimeType: submission.mimeType };
}

/** Content-Disposition for a download, with a plain ASCII fallback and the exact UTF-8 name. */
export function attachmentHeader(name: string): string {
  const fallback = name.replace(/[^\x20-\x7e]|["\\]/g, "_");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
