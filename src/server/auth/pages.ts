import { redirect } from "next/navigation";
import { CHANGE_PASSWORD_PATH, homeFor, SESSION_ENDED_PATH } from "@/domain/access";
import { getCurrentUser } from "./current-user";
import type { StaffUser, StudentUser } from "./guards";
import type { CurrentUser } from "./types";

/**
 * For the change-password page: any signed-in person, including one who must change their password.
 * Without a usable session the visitor goes through the session-ended route, which clears any old cookie
 * and then shows sign-in.
 */
export async function requireSignedInPage(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(SESSION_ENDED_PATH);
  return user;
}

/** For every other signed-in page: sends signed-out visitors to sign-in and holds a person who must change their password. */
async function requireReadyUser(): Promise<CurrentUser> {
  const user = await requireSignedInPage();
  if (user.mustChangePassword) redirect(CHANGE_PASSWORD_PATH);
  return user;
}

/** For staff pages: redirects signed-out visitors to sign-in and Students to their home page. */
export async function requireStaffPage(): Promise<StaffUser> {
  const user = await requireReadyUser();
  if (user.role !== "STAFF") redirect(homeFor(user.role));
  return user as StaffUser;
}

/** For student pages: redirects signed-out visitors to sign-in and Staff to their home page. */
export async function requireStudentPage(): Promise<StudentUser> {
  const user = await requireReadyUser();
  if (user.role !== "STUDENT" || !user.studentId) redirect(homeFor(user.role));
  return user as StudentUser;
}
