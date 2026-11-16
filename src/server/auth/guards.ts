import { ForbiddenError, NotFoundError, PasswordChangeRequiredError, UnauthorizedError } from "@/server/http/errors";
import { getCurrentUser } from "./current-user";
import type { CurrentUser } from "./types";

export type StaffUser = CurrentUser & { role: "STAFF" };
export type StudentUser = CurrentUser & { role: "STUDENT"; studentId: string };

/** Any signed-in user; 401 when signed out, and 403 until a password set by staff has been changed. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  if (user.mustChangePassword) throw new PasswordChangeRequiredError();
  return user;
}

/** Staff only; 401 when signed out and 403 for Students. */
export async function requireStaff(): Promise<StaffUser> {
  const user = await requireUser();
  if (user.role !== "STAFF") throw new ForbiddenError();
  return user as StaffUser;
}

/** Students only; 401 when signed out and 403 for Staff. */
export async function requireStudent(): Promise<StudentUser> {
  const user = await requireUser();
  if (user.role !== "STUDENT" || !user.studentId) throw new ForbiddenError();
  return user as StudentUser;
}

/**
 * Staff, or the Student who owns `studentId`.
 * Another student's data answers 404, so its existence is not revealed.
 */
export async function requireStudentOwner(studentId: string): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role === "STAFF") return user;
  if (user.studentId !== studentId) throw new NotFoundError();
  return user;
}
