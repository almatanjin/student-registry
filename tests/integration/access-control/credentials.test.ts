import { beforeEach, describe, expect, test } from "vitest";
import { prisma } from "@/server/db";
import { verifyCredentials } from "@/server/auth/credentials";
import { hashPassword } from "@/server/auth/password";
import { resetDatabase } from "../helpers/database";

beforeEach(async () => {
  await resetDatabase();
  await prisma.user.create({
    data: { email: "jane.doe@example.com", passwordHash: await hashPassword("correct-horse"), role: "STAFF" },
  });
});

describe("Sign in with email and password", () => {
  test("Valid credentials", async () => {
    const user = await verifyCredentials("jane.doe@example.com", "correct-horse");

    expect(user).toMatchObject({ email: "jane.doe@example.com", role: "STAFF", studentId: null });
  });

  test("Wrong password", async () => {
    expect(await verifyCredentials("jane.doe@example.com", "wrong-password")).toBeNull();
  });

  test("Unknown email", async () => {
    expect(await verifyCredentials("nobody@example.com", "correct-horse")).toBeNull();
  });

  test("Email in different letter case", async () => {
    const user = await verifyCredentials("Jane.Doe@Example.com", "correct-horse");

    expect(user?.email).toBe("jane.doe@example.com");
  });

  test("Blank or malformed input is refused without an error", async () => {
    expect(await verifyCredentials("", "")).toBeNull();
    expect(await verifyCredentials(undefined, 42)).toBeNull();
  });

  test("A student account carries its student record ID", async () => {
    const programme = await prisma.programme.create({ data: { code: "P1", name: "P1", annualFeeMinor: 100 } });
    const student = await prisma.student.create({
      data: {
        studentNumber: "SMS-2026-0001",
        fullName: "Sam Student",
        dateOfBirth: new Date("2005-04-01"),
        academicYearStart: 2026,
        programme: { connect: { id: programme.id } },
        user: {
          create: { email: "sam@example.com", passwordHash: await hashPassword("student-pass"), role: "STUDENT" },
        },
      },
    });

    const user = await verifyCredentials("sam@example.com", "student-pass");

    expect(user).toMatchObject({ role: "STUDENT", studentId: student.id });
  });
});

test("Passwords are stored only as a one-way hash", async () => {
  const stored = await prisma.user.findUniqueOrThrow({ where: { email: "jane.doe@example.com" } });

  expect(stored.passwordHash).not.toContain("correct-horse");
  expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
});
