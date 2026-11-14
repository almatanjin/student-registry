import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, test } from "vitest";
import { POST as submit } from "@/app/api/assessments/[id]/submission/route";
import { GET as download } from "@/app/api/submissions/[id]/file/route";
import { prisma } from "@/server/db";
import { resetDatabase } from "../helpers/database";
import { createAssessment, createModule, createProgramme, createStudentRecord } from "../helpers/fixtures";
import { withParams, type ErrorJson } from "../helpers/http";
import { actAs, staffUser, studentUser } from "../helpers/session";

const PDF = readFileSync("tests/fixtures/sample.pdf");
const DOCX = readFileSync("tests/fixtures/sample.docx");
const PNG = readFileSync("tests/fixtures/sample.png");

const DAY = 24 * 60 * 60 * 1000;
const future = () => new Date(Date.now() + 7 * DAY);
const past = () => new Date(Date.now() - DAY);

type SubmissionJson = { submission: { id: string; originalName: string; submittedAt: string; state: string } };

let programmeId: string;
let moduleId: string;
let studentId: string;

beforeEach(async () => {
  await resetDatabase();
  programmeId = (await createProgramme()).id;
  moduleId = (await createModule(programmeId)).id;
  studentId = (await createStudentRecord({ programmeId })).id;
  actAs(studentUser(studentId));
});

function upload(assessmentId: string, bytes: Uint8Array | null, name = "essay.pdf", type = "application/pdf") {
  const form = new FormData();
  if (bytes) form.set("file", new File([new Uint8Array(bytes)], name, { type }));
  return submit(
    new Request(`http://localhost/api/assessments/${assessmentId}/submission`, { method: "POST", body: form }),
    withParams({ id: assessmentId }),
  );
}

async function errorOf(response: Response) {
  return ((await response.json()) as ErrorJson).error;
}

function storedPath(key: string) {
  return path.join(process.env.UPLOAD_DIR ?? "", key);
}

describe("Students upload one PDF or DOCX file", () => {
  test("Valid upload", async () => {
    const assessment = await createAssessment(moduleId, { deadline: future() });

    const response = await upload(assessment.id, PDF, "Essay 1.pdf");

    expect(response.status).toBe(201);
    const { submission } = (await response.json()) as SubmissionJson;
    expect(submission).toMatchObject({ originalName: "Essay 1.pdf", state: "on-time" });
    const stored = await prisma.submission.findFirstOrThrow();
    expect(stored).toMatchObject({ mimeType: "application/pdf", sizeBytes: PDF.length });
    expect(readFileSync(storedPath(stored.storageKey))).toEqual(PDF);
  });

  test("a DOCX file is accepted", async () => {
    const assessment = await createAssessment(moduleId);

    const response = await upload(assessment.id, DOCX, "essay.docx", "application/octet-stream");

    expect(response.status).toBe(201);
    expect((await prisma.submission.findFirstOrThrow()).mimeType).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });

  test("Wrong file type", async () => {
    const assessment = await createAssessment(moduleId);
    const attempts: [Uint8Array, string][] = [
      [PNG, "picture.png"],
      [PNG, "renamed.pdf"],
      [PDF, "essay.txt"],
    ];
    for (const [bytes, name] of attempts) {
      const response = await upload(assessment.id, bytes, name);

      expect(response.status, name).toBe(400);
      expect((await errorOf(response)).fields).toEqual({ file: "Upload a PDF or DOCX file" });
    }
    expect(await prisma.submission.count()).toBe(0);
  });

  test("File too large or empty", async () => {
    const assessment = await createAssessment(moduleId);
    const oversized = new Uint8Array(10 * 1024 * 1024 + 1);
    oversized.set(PDF.subarray(0, 8));

    const tooLarge = await upload(assessment.id, oversized, "huge.pdf");
    const empty = await upload(assessment.id, new Uint8Array(0), "empty.pdf");

    expect(tooLarge.status).toBe(413);
    expect((await errorOf(tooLarge)).message).toBe("The file is larger than 10 MB");
    expect(empty.status).toBe(400);
    expect((await errorOf(empty)).fields).toEqual({ file: "The file is empty" });
  });

  test("a request with no file is rejected", async () => {
    const assessment = await createAssessment(moduleId);

    const response = await upload(assessment.id, null);

    expect(response.status).toBe(400);
    expect((await errorOf(response)).fields).toEqual({ file: "Choose a file to upload" });
  });

  test("Student not currently enrolled", async () => {
    const assessment = await createAssessment(moduleId);
    await prisma.student.update({ where: { id: studentId }, data: { status: "DEFERRED" } });

    const response = await upload(assessment.id, PDF);

    expect(response.status).toBe(409);
    expect((await errorOf(response)).message).toBe("Only enrolled students can submit work");
  });

  test("Closed assessment", async () => {
    const assessment = await createAssessment(moduleId, { isOpen: false });

    const response = await upload(assessment.id, PDF);

    expect(response.status).toBe(409);
    expect((await errorOf(response)).message).toBe("This assessment is closed");
  });

  test("an assessment from another programme answers 404", async () => {
    const otherModule = await createModule((await createProgramme()).id);
    const assessment = await createAssessment(otherModule.id);

    expect((await upload(assessment.id, PDF)).status).toBe(404);
  });

  test("Staff cannot upload on a student's behalf", async () => {
    const assessment = await createAssessment(moduleId);
    actAs(staffUser());

    expect((await upload(assessment.id, PDF)).status).toBe(403);
  });
});

describe("One submission per student per assessment", () => {
  test("Resubmitting before the deadline", async () => {
    const assessment = await createAssessment(moduleId, { deadline: future() });
    await upload(assessment.id, PDF, "draft.pdf");
    const first = await prisma.submission.findFirstOrThrow();

    const response = await upload(assessment.id, DOCX, "final.docx");

    expect(response.status).toBe(201);
    const rows = await prisma.submission.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ originalName: "final.docx", id: first.id });
    expect(rows[0].submittedAt.getTime()).toBeGreaterThanOrEqual(first.submittedAt.getTime());
    expect(rows[0].storageKey).not.toBe(first.storageKey);
    expect(existsSync(storedPath(first.storageKey))).toBe(false);
  });

  test("Resubmitting after the deadline", async () => {
    const assessment = await createAssessment(moduleId, { deadline: future() });
    await upload(assessment.id, PDF, "on-time.pdf");
    await prisma.assessment.update({ where: { id: assessment.id }, data: { deadline: past() } });

    const response = await upload(assessment.id, PDF, "too-late.pdf");

    expect(response.status).toBe(409);
    expect((await errorOf(response)).message).toBe(
      "The deadline has passed, so your submission can no longer be replaced",
    );
    expect((await prisma.submission.findFirstOrThrow()).originalName).toBe("on-time.pdf");
  });

  test("two uploads at the same moment still leave one submission and no orphaned files", async () => {
    const assessment = await createAssessment(moduleId);

    const responses = await Promise.all([upload(assessment.id, PDF, "a.pdf"), upload(assessment.id, PDF, "b.pdf")]);

    expect(responses.map((r) => r.status)).toEqual([201, 201]);
    const rows = await prisma.submission.findMany();
    expect(rows).toHaveLength(1);
    expect(existsSync(storedPath(rows[0].storageKey))).toBe(true);
  });
});

describe("Late submissions are accepted and flagged", () => {
  test("First submission after the deadline", async () => {
    const assessment = await createAssessment(moduleId, { deadline: past() });

    const response = await upload(assessment.id, PDF);

    expect(response.status).toBe(201);
    expect(((await response.json()) as SubmissionJson).submission.state).toBe("late");
  });
});

describe("Submitted files are access-controlled", () => {
  async function submittedId() {
    const assessment = await createAssessment(moduleId);
    const response = await upload(assessment.id, PDF, "My Essay.pdf");
    return ((await response.json()) as SubmissionJson).submission.id;
  }

  function fetchFile(id: string) {
    return download(new Request(`http://localhost/api/submissions/${id}/file`), withParams({ id }));
  }

  test("Student downloads their own file", async () => {
    const id = await submittedId();

    const response = await fetchFile(id);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      `attachment; filename="My Essay.pdf"; filename*=UTF-8''My%20Essay.pdf`,
    );
    expect(Buffer.from(await response.arrayBuffer())).toEqual(PDF);
  });

  test("staff can download any submission", async () => {
    const id = await submittedId();
    actAs(staffUser());

    expect((await fetchFile(id)).status).toBe(200);
  });

  test("Another student tries to download it", async () => {
    const id = await submittedId();
    const other = await createStudentRecord({ programmeId });
    actAs(studentUser(other.id));

    expect((await fetchFile(id)).status).toBe(404);
  });

  test("a submission that does not exist answers 404", async () => {
    actAs(staffUser());

    expect((await fetchFile("missing")).status).toBe(404);
  });
});
