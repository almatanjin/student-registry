import { beforeEach, describe, expect, test } from "vitest";
import { changeOwnPassword } from "@/server/auth/account";
import { verifyCredentials } from "@/server/auth/credentials";
import { hashPassword } from "@/server/auth/password";
import { prisma } from "@/server/db";
import { ValidationError } from "@/server/http/errors";
import { resetDatabase } from "../helpers/database";

const EMAIL = "kofi@sms.example";
let userId: string;

beforeEach(async () => {
  await resetDatabase();
  const user = await prisma.user.create({
    data: { email: EMAIL, passwordHash: await hashPassword("initial-pass"), role: "STAFF", mustChangePassword: true },
  });
  userId = user.id;
});

const change = (overrides: Record<string, unknown> = {}) =>
  changeOwnPassword(userId, {
    currentPassword: "initial-pass",
    newPassword: "brand-new-pass",
    confirmPassword: "brand-new-pass",
    ...overrides,
  });

async function fieldErrorsOf(promise: Promise<unknown>) {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(ValidationError);
  return (error as ValidationError).fields;
}

describe("Signed-in people change their own password", () => {
  test("Changing your password", async () => {
    const before = await verifyCredentials(EMAIL, "initial-pass");

    await change();

    expect(await verifyCredentials(EMAIL, "initial-pass")).toBeNull();
    const after = await verifyCredentials(EMAIL, "brand-new-pass");
    expect(after).toMatchObject({ mustChangePassword: false });
    expect(after?.passwordVersion).toBeGreaterThan(before?.passwordVersion ?? Infinity);
  });

  test("Wrong current password", async () => {
    expect(await fieldErrorsOf(change({ currentPassword: "not-my-pass" }))).toEqual({
      currentPassword: "Your current password is incorrect",
    });
    expect(await verifyCredentials(EMAIL, "initial-pass")).toMatchObject({ mustChangePassword: true });
  });

  test("New password too short", async () => {
    expect(await fieldErrorsOf(change({ newPassword: "short", confirmPassword: "short" }))).toEqual({
      newPassword: "Use at least 8 characters",
    });
    expect(await verifyCredentials(EMAIL, "initial-pass")).not.toBeNull();
  });

  test("Passwords do not match", async () => {
    expect(await fieldErrorsOf(change({ confirmPassword: "brand-new-pasz" }))).toEqual({
      confirmPassword: "The passwords do not match",
    });
    expect(await verifyCredentials(EMAIL, "initial-pass")).not.toBeNull();
  });

  test("Same as the current password", async () => {
    expect(
      await fieldErrorsOf(change({ newPassword: "initial-pass", confirmPassword: "initial-pass" })),
    ).toEqual({ newPassword: "Choose a password different from your current one" });
  });

  test("an account that no longer exists is refused", async () => {
    await prisma.user.delete({ where: { id: userId } });

    await expect(change()).rejects.toThrow();
  });
});
