import { describe, expect, test } from "vitest";
import { changePasswordSchema, resetPasswordSchema } from "./password";

function fieldErrors(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
  return Object.fromEntries((result.error?.issues ?? []).map((issue) => [issue.path.join("."), issue.message]));
}

const valid = { currentPassword: "old-password", newPassword: "new-password", confirmPassword: "new-password" };

describe("changePasswordSchema", () => {
  test("accepts a current password and a matching new password of 8 or more characters", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  test("New password too short", () => {
    const result = changePasswordSchema.safeParse({ ...valid, newPassword: "short", confirmPassword: "short" });

    expect(fieldErrors(result)).toEqual({ newPassword: "Use at least 8 characters" });
  });

  test("a new password over 200 characters is refused", () => {
    const long = "x".repeat(201);
    const result = changePasswordSchema.safeParse({ ...valid, newPassword: long, confirmPassword: long });

    expect(fieldErrors(result)).toEqual({ newPassword: "Use 200 characters or fewer" });
  });

  test("Passwords do not match", () => {
    const result = changePasswordSchema.safeParse({ ...valid, confirmPassword: "new-passwort" });

    expect(fieldErrors(result)).toEqual({ confirmPassword: "The passwords do not match" });
  });

  test("Same as the current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "same-password",
      newPassword: "same-password",
      confirmPassword: "same-password",
    });

    expect(fieldErrors(result)).toEqual({ newPassword: "Choose a password different from your current one" });
  });

  test("an empty current password asks for it", () => {
    const result = changePasswordSchema.safeParse({ ...valid, currentPassword: "" });

    expect(fieldErrors(result)).toEqual({ currentPassword: "Enter your current password" });
  });

  test("missing fields each get their own message", () => {
    const result = changePasswordSchema.safeParse({});

    expect(fieldErrors(result)).toEqual({
      currentPassword: "Enter your current password",
      newPassword: "Use at least 8 characters",
      confirmPassword: "Enter the new password again",
    });
  });
});

describe("resetPasswordSchema", () => {
  test("accepts a temporary password of 8 or more characters", () => {
    expect(resetPasswordSchema.safeParse({ temporaryPassword: "temporary1" }).success).toBe(true);
  });

  test("Temporary password too short", () => {
    const result = resetPasswordSchema.safeParse({ temporaryPassword: "short" });

    expect(fieldErrors(result)).toEqual({ temporaryPassword: "Use at least 8 characters" });
  });
});
