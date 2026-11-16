"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { CHANGE_PASSWORD_PATH, homeFor, SESSION_ENDED_PATH } from "@/domain/access";
import { changeOwnPassword } from "@/server/auth/account";
import { getCurrentUser } from "@/server/auth/current-user";
import { ValidationError } from "@/server/http/errors";

export type ChangePasswordState = { fields?: Record<string, string> };

/**
 * Changes the signed-in person's password, then signs them in again with it.
 * Signing in again issues a session for the new password version, so this browser stays
 * signed in while every older session stops working.
 */
export async function changePasswordAction(
  _previous: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const user = await getCurrentUser();
  if (!user) redirect(SESSION_ENDED_PATH);

  const input = {
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
  try {
    await changeOwnPassword(user.id, input);
  } catch (error) {
    if (error instanceof ValidationError) return { fields: error.fields };
    throw error;
  }

  // A forced change carries on to the home page; a voluntary one comes back here with a confirmation.
  const redirectTo = user.mustChangePassword ? homeFor(user.role) : `${CHANGE_PASSWORD_PATH}?changed=1`;
  await signIn("credentials", { email: user.email, password: input.newPassword, redirectTo });
  return {};
}
