import { redirect } from "next/navigation";
import { homeFor, SIGN_IN_PATH } from "@/domain/access";
import { getCurrentUser } from "./current-user";
import type { StaffUser, StudentUser } from "./guards";

/** For staff pages: redirects signed-out visitors to sign-in and Students to their home page. */
export async function requireStaffPage(): Promise<StaffUser> {
  const user = await getCurrentUser();
  if (!user) redirect(SIGN_IN_PATH);
  if (user.role !== "STAFF") redirect(homeFor(user.role));
  return user as StaffUser;
}

/** For student pages: redirects signed-out visitors to sign-in and Staff to their home page. */
export async function requireStudentPage(): Promise<StudentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(SIGN_IN_PATH);
  if (user.role !== "STUDENT" || !user.studentId) redirect(homeFor(user.role));
  return user as StudentUser;
}
