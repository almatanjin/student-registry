import { beforeEach, describe, expect, test } from "vitest";
import { PUT as resetPassword } from "@/app/api/students/[id]/password/route";
import { verifyCredentials } from "@/server/auth/credentials";
import { resetDatabase } from "../helpers/database";
import { createProgramme, createStudentRecord } from "../helpers/fixtures";
import { jsonRequest, withParams, type ErrorJson } from "../helpers/http";
import { actAs, staffUser, studentUser } from "../helpers/session";

const EMAIL = "lena@sms.example";
let studentId: string;

beforeEach(async () => {
  await resetDatabase();
  const programme = await createProgramme();
  studentId = (await createStudentRecord({ programmeId: programme.id, email: EMAIL })).id;
  actAs(staffUser());
});

const reset = (id: string, body: unknown) =>
  resetPassword(jsonRequest("PUT", `/api/students/${id}/password`, body), withParams({ id }));

describe("Staff reset a student's password", () => {
  test("Resetting a forgotten password", async () => {
    const before = await verifyCredentials(EMAIL, "student-password");

    const response = await reset(studentId, { temporaryPassword: "temporary-123" });

    expect(response.status).toBe(204);
    expect(await verifyCredentials(EMAIL, "student-password")).toBeNull();
    const after = await verifyCredentials(EMAIL, "temporary-123");
    expect(after).toMatchObject({ mustChangePassword: true });
    expect(after?.passwordVersion).toBeGreaterThan(before?.passwordVersion ?? Infinity);
  });

  test("Temporary password too short", async () => {
    const response = await reset(studentId, { temporaryPassword: "short" });

    expect(response.status).toBe(400);
    expect(((await response.json()) as ErrorJson).error.fields).toEqual({
      temporaryPassword: "Use at least 8 characters",
    });
    expect(await verifyCredentials(EMAIL, "student-password")).not.toBeNull();
  });

  test("Student tries to reset a password", async () => {
    actAs(studentUser(studentId));

    const response = await reset(studentId, { temporaryPassword: "temporary-123" });

    expect(response.status).toBe(403);
    expect(await verifyCredentials(EMAIL, "student-password")).toMatchObject({ mustChangePassword: false });
  });

  test("Unknown student", async () => {
    const response = await reset("no-such-student", { temporaryPassword: "temporary-123" });

    expect(response.status).toBe(404);
  });
});

describe("Password changes never expose passwords", () => {
  test("Reset response", async () => {
    const response = await reset(studentId, { temporaryPassword: "temporary-123" });

    expect(await response.text()).toBe("");
  });
});
