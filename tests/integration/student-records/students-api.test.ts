import { beforeEach, describe, expect, test } from "vitest";
import { GET as listStudents, POST as createStudent } from "@/app/api/students/route";
import { GET as getStudent, PATCH as updateStudent } from "@/app/api/students/[id]/route";
import { verifyCredentials } from "@/server/auth/credentials";
import { today } from "@/server/config";
import { prisma } from "@/server/db";
import { resetDatabase } from "../helpers/database";
import {
  createProgramme,
  createStaffAccount,
  createStudentRecord,
  recordPaymentDirectly,
} from "../helpers/fixtures";
import { jsonRequest, withParams, type ErrorJson } from "../helpers/http";
import { actAs, staffUser, studentUser } from "../helpers/session";

type StudentJson = {
  id: string;
  studentNumber: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  academicYear: string;
  status: string;
  programme: { id: string; code: string; name: string };
};

let programmeId: string;

function newStudent(overrides: Record<string, unknown> = {}) {
  return {
    fullName: "Amara Okafor",
    email: "amara.okafor@sms.example",
    dateOfBirth: "2005-03-14",
    programmeId,
    academicYear: "2025/26",
    status: "ENROLLED",
    initialPassword: "first-login-pass",
    ...overrides,
  };
}

async function create(body: Record<string, unknown>) {
  return createStudent(jsonRequest("POST", "/api/students", body), withParams({}));
}

async function update(id: string, body: Record<string, unknown>) {
  return updateStudent(jsonRequest("PATCH", `/api/students/${id}`, body), withParams({ id }));
}

async function list(query = "") {
  const response = await listStudents(jsonRequest("GET", `/api/students${query}`), withParams({}));
  return (await response.json()) as { students: StudentJson[] };
}

beforeEach(async () => {
  await resetDatabase();
  programmeId = (await createProgramme({ code: "BSC-CS", name: "BSc Computer Science" })).id;
  actAs(staffUser());
});

describe("Staff create a student record", () => {
  test("Valid new student", async () => {
    const response = await create(newStudent());

    expect(response.status).toBe(201);
    const { student } = (await response.json()) as { student: StudentJson };
    expect(student).toMatchObject({
      studentNumber: "SMS-2025-0001",
      fullName: "Amara Okafor",
      email: "amara.okafor@sms.example",
      dateOfBirth: "2005-03-14",
      academicYear: "2025/26",
      status: "ENROLLED",
      programme: { id: programmeId, code: "BSC-CS" },
    });
    expect(await verifyCredentials("amara.okafor@sms.example", "first-login-pass")).toMatchObject({
      role: "STUDENT",
      studentId: student.id,
    });
  });

  test("a new student must change the initial password at first sign-in", async () => {
    await create(newStudent());

    expect(await verifyCredentials("amara.okafor@sms.example", "first-login-pass")).toMatchObject({
      mustChangePassword: true,
    });
  });

  test("the email is stored lower-case", async () => {
    const response = await create(newStudent({ email: "  Amara.OKAFOR@SMS.example " }));

    expect(((await response.json()) as { student: StudentJson }).student.email).toBe("amara.okafor@sms.example");
  });

  test("Missing or invalid fields", async () => {
    const response = await create(
      newStudent({ fullName: "  ", email: "not-an-email", initialPassword: "short", status: undefined }),
    );

    expect(response.status).toBe(400);
    const { error } = (await response.json()) as ErrorJson;
    expect(Object.keys(error.fields ?? {}).sort()).toEqual(["email", "fullName", "initialPassword", "status"]);
    expect(await prisma.student.count()).toBe(0);
    expect(await prisma.user.count()).toBe(0);
  });

  test("an unknown programme is reported on the programme field", async () => {
    const response = await create(newStudent({ programmeId: "no-such-programme" }));

    expect(response.status).toBe(400);
    expect(((await response.json()) as ErrorJson).error.fields).toEqual({ programmeId: "Choose a programme" });
  });
});

describe("Student details are validated", () => {
  test("Duplicate email", async () => {
    await create(newStudent());

    const response = await create(newStudent({ email: "AMARA.OKAFOR@sms.example" }));

    expect(response.status).toBe(409);
    expect(((await response.json()) as ErrorJson).error).toMatchObject({
      message: "This email is already in use",
      fields: { email: "This email is already in use" },
    });
    expect(await prisma.student.count()).toBe(1);
  });

  test("Duplicate email alongside other field errors", async () => {
    await create(newStudent());

    const response = await create({ email: "AMARA.OKAFOR@sms.example" });

    expect(response.status).toBe(400);
    expect(((await response.json()) as ErrorJson).error.fields).toMatchObject({
      email: "This email is already in use",
      fullName: "Enter the full name",
    });
    expect(await prisma.student.count()).toBe(1);
  });

  test("a duplicate email on edit is reported alongside other field errors", async () => {
    await create(newStudent());
    const { student } = (await (await create(newStudent({ email: "second@sms.example" }))).json()) as {
      student: StudentJson;
    };

    const response = await update(student.id, { email: "Amara.Okafor@sms.example", fullName: "" });

    expect(response.status).toBe(400);
    expect(((await response.json()) as ErrorJson).error.fields).toEqual({
      email: "This email is already in use",
      fullName: "Enter the full name",
    });
  });

  test("a student's own email is not reported as taken when other fields are invalid", async () => {
    const { student } = (await (await create(newStudent())).json()) as { student: StudentJson };

    const response = await update(student.id, { email: "amara.okafor@sms.example", fullName: "" });

    expect(((await response.json()) as ErrorJson).error.fields).toEqual({ fullName: "Enter the full name" });
  });

  test("an email used by a staff account is also taken", async () => {
    await createStaffAccount("registrar@sms.example");

    const response = await create(newStudent({ email: "registrar@sms.example" }));

    expect(response.status).toBe(409);
  });

  test("Date of birth in the future", async () => {
    for (const dateOfBirth of [today(), "2999-01-01"]) {
      const response = await create(newStudent({ dateOfBirth }));

      expect(response.status).toBe(400);
      expect(((await response.json()) as ErrorJson).error.fields).toHaveProperty("dateOfBirth");
    }
  });

  test("Malformed academic year", async () => {
    for (const academicYear of ["2025/27", "2025"]) {
      const response = await create(newStudent({ academicYear }));

      expect(response.status).toBe(400);
      expect(((await response.json()) as ErrorJson).error.fields).toHaveProperty("academicYear");
    }
  });
});

describe("Student IDs are generated automatically", () => {
  test("First student of an academic year, then the next in the same year", async () => {
    const first = (await (await create(newStudent())).json()) as { student: StudentJson };
    const second = (await (await create(newStudent({ email: "second@sms.example" }))).json()) as {
      student: StudentJson;
    };

    expect(first.student.studentNumber).toBe("SMS-2025-0001");
    expect(second.student.studentNumber).toBe("SMS-2025-0002");
  });

  test("each academic year has its own sequence", async () => {
    await create(newStudent());
    const response = await create(newStudent({ email: "later@sms.example", academicYear: "2026/27" }));

    expect(((await response.json()) as { student: StudentJson }).student.studentNumber).toBe("SMS-2026-0001");
  });

  test("Two students created at the same moment", async () => {
    const responses = await Promise.all(
      Array.from({ length: 5 }, (_, i) => create(newStudent({ email: `same-moment-${i}@sms.example` }))),
    );

    const numbers = await Promise.all(
      responses.map(async (response) => ((await response.json()) as { student: StudentJson }).student.studentNumber),
    );
    expect(new Set(numbers).size).toBe(5);
    expect(numbers.sort()).toEqual(["SMS-2025-0001", "SMS-2025-0002", "SMS-2025-0003", "SMS-2025-0004", "SMS-2025-0005"]);
  });

  test("Staff cannot set the ID", async () => {
    const created = (await (await create(newStudent({ studentNumber: "SMS-1900-9999" }))).json()) as {
      student: StudentJson;
    };
    expect(created.student.studentNumber).toBe("SMS-2025-0001");

    const edited = await update(created.student.id, { studentNumber: "SMS-1900-9999", fullName: "Amara O." });
    expect(((await edited.json()) as { student: StudentJson }).student.studentNumber).toBe("SMS-2025-0001");
  });

  test("a failed creation does not use up a number", async () => {
    await create(newStudent());
    await create(newStudent()); // duplicate email, rejected

    const response = await create(newStudent({ email: "third@sms.example" }));

    expect(((await response.json()) as { student: StudentJson }).student.studentNumber).toBe("SMS-2025-0002");
  });
});

describe("Enrolment status", () => {
  test("Changing status", async () => {
    const { student } = (await (await create(newStudent())).json()) as { student: StudentJson };

    const response = await update(student.id, { status: "DEFERRED" });

    expect(response.status).toBe(200);
    expect(((await response.json()) as { student: StudentJson }).student.status).toBe("DEFERRED");
  });

  test("an unknown status is rejected", async () => {
    const { student } = (await (await create(newStudent())).json()) as { student: StudentJson };

    const response = await update(student.id, { status: "EXPELLED" });

    expect(response.status).toBe(400);
  });
});

describe("Staff edit a student record", () => {
  test("Editing details", async () => {
    const { student } = (await (await create(newStudent())).json()) as { student: StudentJson };

    const response = await update(student.id, { fullName: "Amara N. Okafor" });

    const edited = ((await response.json()) as { student: StudentJson }).student;
    expect(edited.fullName).toBe("Amara N. Okafor");
    expect(edited.studentNumber).toBe(student.studentNumber);
  });

  test("changing the email also changes the sign-in email", async () => {
    const { student } = (await (await create(newStudent())).json()) as { student: StudentJson };

    await update(student.id, { email: "amara.new@sms.example" });

    expect(await verifyCredentials("amara.new@sms.example", "first-login-pass")).not.toBeNull();
    expect(await verifyCredentials("amara.okafor@sms.example", "first-login-pass")).toBeNull();
  });

  test("editing to an email another account has is rejected", async () => {
    await create(newStudent({ email: "taken@sms.example" }));
    const { student } = (await (await create(newStudent())).json()) as { student: StudentJson };

    const response = await update(student.id, { email: "TAKEN@sms.example" });

    expect(response.status).toBe(409);
  });

  test("keeping the same email is allowed", async () => {
    const { student } = (await (await create(newStudent())).json()) as { student: StudentJson };

    const response = await update(student.id, { email: "amara.okafor@sms.example", fullName: "A. Okafor" });

    expect(response.status).toBe(200);
  });

  test("edits follow the same validation as creation", async () => {
    const { student } = (await (await create(newStudent())).json()) as { student: StudentJson };

    const response = await update(student.id, { dateOfBirth: "2999-01-01", academicYear: "2025" });

    expect(response.status).toBe(400);
    expect(Object.keys(((await response.json()) as ErrorJson).error.fields ?? {}).sort()).toEqual([
      "academicYear",
      "dateOfBirth",
    ]);
  });

  test("Changing programme before any payment", async () => {
    const other = await createProgramme({ code: "MSC-DS" });
    const { student } = (await (await create(newStudent())).json()) as { student: StudentJson };

    const response = await update(student.id, { programmeId: other.id, academicYear: "2026/27" });

    expect(response.status).toBe(200);
    expect(((await response.json()) as { student: StudentJson }).student).toMatchObject({
      programme: { code: "MSC-DS" },
      academicYear: "2026/27",
      studentNumber: "SMS-2025-0001",
    });
  });

  test("Changing programme after a payment", async () => {
    const staff = await createStaffAccount();
    const other = await createProgramme({ code: "MSC-DS" });
    const { student } = (await (await create(newStudent())).json()) as { student: StudentJson };
    await recordPaymentDirectly(student.id, staff.id);

    for (const change of [{ programmeId: other.id }, { academicYear: "2026/27" }]) {
      const response = await update(student.id, change);

      expect(response.status).toBe(409);
      expect(((await response.json()) as ErrorJson).error.message).toMatch(/payment/i);
    }
  });

  test("other details can still be edited after a payment", async () => {
    const staff = await createStaffAccount();
    const { student } = (await (await create(newStudent())).json()) as { student: StudentJson };
    await recordPaymentDirectly(student.id, staff.id);

    const response = await update(student.id, { fullName: "Amara Okafor-Bello", programmeId, academicYear: "2025/26" });

    expect(response.status).toBe(200);
  });

  test("editing a student that does not exist answers 404", async () => {
    const response = await update("missing", { fullName: "Nobody" });

    expect(response.status).toBe(404);
  });
});

describe("Staff search and filter the student list", () => {
  beforeEach(async () => {
    const msc = await createProgramme({ code: "MSC-DS" });
    await createStudentRecord({ programmeId, fullName: "Alice Smith", studentNumber: "SMS-2025-0001" });
    await createStudentRecord({ programmeId, fullName: "Khalid Ali", studentNumber: "SMS-2025-0002", status: "WITHDRAWN" });
    await createStudentRecord({ programmeId: msc.id, fullName: "Natalia Romero", studentNumber: "SMS-2025-0003", status: "WITHDRAWN" });
    await createStudentRecord({ programmeId: msc.id, fullName: "Ben Carter", studentNumber: "SMS-2026-0001" });
  });

  test("Search by part of a name", async () => {
    const { students } = await list("?q=ALI");

    expect(students.map((s) => s.fullName).sort()).toEqual(["Alice Smith", "Khalid Ali", "Natalia Romero"]);
  });

  test("Search by Student ID", async () => {
    const { students } = await list("?q=2025-0003");

    expect(students.map((s) => s.studentNumber)).toEqual(["SMS-2025-0003"]);
  });

  test("Combined filters", async () => {
    const { students } = await list(`?programmeId=${programmeId}&status=WITHDRAWN`);

    expect(students.map((s) => s.fullName)).toEqual(["Khalid Ali"]);
  });

  test("search and filters combine", async () => {
    const { students } = await list("?q=ali&status=WITHDRAWN");

    expect(students.map((s) => s.fullName).sort()).toEqual(["Khalid Ali", "Natalia Romero"]);
  });

  test("No matches", async () => {
    expect((await list("?q=zzz")).students).toEqual([]);
  });

  test("the list is ordered by Student ID and shows the listed columns", async () => {
    const { students } = await list();

    expect(students.map((s) => s.studentNumber)).toEqual([
      "SMS-2025-0001",
      "SMS-2025-0002",
      "SMS-2025-0003",
      "SMS-2026-0001",
    ]);
    expect(students[0]).toMatchObject({ fullName: "Alice Smith", academicYear: "2026/27", status: "ENROLLED" });
  });

  test("an unknown status filter is rejected", async () => {
    const response = await listStudents(jsonRequest("GET", "/api/students?status=GONE"), withParams({}));

    expect(response.status).toBe(400);
  });
});

describe("access to student records", () => {
  test("Reading a student record shows no password or password hash", async () => {
    const { student } = (await (await create(newStudent())).json()) as { student: StudentJson };

    const single = await (await getStudent(jsonRequest("GET", `/api/students/${student.id}`), withParams({ id: student.id }))).text();
    const listed = JSON.stringify(await list());

    for (const text of [single, listed]) {
      expect(text).not.toMatch(/password/i);
      expect(text).not.toContain("$2");
    }
  });

  test("Students cannot create or list students", async () => {
    actAs(studentUser("someone"));

    expect((await create(newStudent())).status).toBe(403);
    expect((await listStudents(jsonRequest("GET", "/api/students"), withParams({}))).status).toBe(403);
  });

  test("a Student reads their own record and gets 404 for anyone else's", async () => {
    const own = await createStudentRecord({ programmeId });
    const other = await createStudentRecord({ programmeId });
    actAs(studentUser(own.id));

    const ownResponse = await getStudent(jsonRequest("GET", `/api/students/${own.id}`), withParams({ id: own.id }));
    const otherResponse = await getStudent(jsonRequest("GET", `/api/students/${other.id}`), withParams({ id: other.id }));

    expect(ownResponse.status).toBe(200);
    expect(otherResponse.status).toBe(404);
  });

  test("Students cannot edit records, even their own", async () => {
    const own = await createStudentRecord({ programmeId });
    actAs(studentUser(own.id));

    expect((await update(own.id, { fullName: "Changed" })).status).toBe(403);
  });
});
