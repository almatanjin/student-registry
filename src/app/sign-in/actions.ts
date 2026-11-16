"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { CHANGE_PASSWORD_PATH, homeFor } from "@/domain/access";
import { verifyCredentials } from "@/server/auth/credentials";

export type SignInState = { error?: string; email?: string };

// One message for every failure, so it never reveals whether the email exists.
const INVALID = "Invalid email or password";

export async function signInAction(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "");
  const password = formData.get("password");

  // Look the account up first so the redirect goes straight to the right page:
  // the change-password page while a password set by staff is still in use, otherwise the role's home page.
  const user = await verifyCredentials(email, password);
  if (!user) return { error: INVALID, email };
  const redirectTo = user.mustChangePassword ? CHANGE_PASSWORD_PATH : homeFor(user.role);

  try {
    await signIn("credentials", { email, password, redirectTo });
    return {};
  } catch (error) {
    if (error instanceof AuthError) return { error: INVALID, email };
    throw error; // the redirect after a successful sign-in
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
}
