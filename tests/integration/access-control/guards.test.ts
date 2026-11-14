import { beforeEach, describe, expect, test } from "vitest";
import { requireStaff, requireStudent, requireStudentOwner } from "@/server/auth/guards";
import { route } from "@/server/http/route";
import { actAs, staffUser, studentUser } from "../helpers/session";

// Sample routes built the same way as the real Route Handlers.
const staffRoute = route(async () => {
  const user = await requireStaff();
  return Response.json({ ok: true, by: user.email });
});

const studentRoute = route(async (_request: Request, context: { params: Promise<{ studentId: string }> }) => {
  const { studentId } = await context.params;
  const user = await requireStudentOwner(studentId);
  return Response.json({ ok: true, studentId: user.studentId });
});

const ownRecordRoute = route(async () => {
  const user = await requireStudent();
  return Response.json({ studentId: user.studentId });
});

const params = (studentId: string) => ({ params: Promise.resolve({ studentId }) });
const request = () => new Request("http://localhost/api/sample");

beforeEach(() => actAs(null));

describe("Signed-out visitors cannot reach the application", () => {
  test("Calling an API route while signed out", async () => {
    const response = await staffRoute(request(), params("x"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: { code: "unauthorized", message: "Sign in to continue." } });
  });
});

describe("Staff-only functions are refused to Students", () => {
  test("Student calls a staff API operation", async () => {
    actAs(studentUser("student-a"));

    const response = await staffRoute(request(), params("x"));

    expect(response.status).toBe(403);
  });

  test("Staff call a staff API operation", async () => {
    actAs(staffUser());

    const response = await staffRoute(request(), params("x"));

    expect(response.status).toBe(200);
  });
});

describe("Students only see their own data", () => {
  test("a Student reads their own data", async () => {
    actAs(studentUser("student-a"));

    const response = await studentRoute(request(), params("student-a"));

    expect(response.status).toBe(200);
  });

  test("Student requests another student's data", async () => {
    actAs(studentUser("student-a"));

    const response = await studentRoute(request(), params("student-b"));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: "not_found", message: "Not found." } });
  });

  test("Staff may read any student's data", async () => {
    actAs(staffUser());

    const response = await studentRoute(request(), params("student-b"));

    expect(response.status).toBe(200);
  });

  test("a student-only operation is refused to Staff", async () => {
    actAs(staffUser());

    const response = await ownRecordRoute(request(), params("x"));

    expect(response.status).toBe(403);
  });
});
