import type { Role } from "@/server/auth/types";

export const SIGN_IN_PATH = "/sign-in";

/** Where anyone signed in changes their password, and where a person who must change it is held. */
export const CHANGE_PASSWORD_PATH = "/change-password";

/** Clears a session cookie that the server no longer accepts (the password changed since sign-in). */
export const SESSION_ENDED_PATH = "/session-ended";

const HOME: Record<Role, string> = {
  STAFF: "/staff/dashboard",
  STUDENT: "/student/assessments",
};

/** Area each role owns; the other role is sent home from it. */
const AREA: Record<Role, string> = {
  STAFF: "/staff",
  STUDENT: "/student",
};

export function homeFor(role: Role): string {
  return HOME[role];
}

function isUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Where a page request should be redirected, or null to let it through.
 * `role` is null for signed-out visitors; `mustChangePassword` holds a person on the change-password page.
 */
export function pageRedirect(pathname: string, role: Role | null, mustChangePassword = false): string | null {
  if (role === null) return pathname === SIGN_IN_PATH ? null : SIGN_IN_PATH;
  // The cookie may look valid here while the server has ended the session, so this path is never redirected.
  if (pathname === SESSION_ENDED_PATH) return null;
  if (mustChangePassword) return pathname === CHANGE_PASSWORD_PATH ? null : CHANGE_PASSWORD_PATH;
  if (pathname === SIGN_IN_PATH || pathname === "/") return homeFor(role);

  const otherRole: Role = role === "STAFF" ? "STUDENT" : "STAFF";
  if (isUnder(pathname, AREA[otherRole])) return homeFor(role);
  return null;
}

/** Signed-out API calls are refused, except the Auth.js sign-in routes. Roles are checked by each route. */
export function apiAccess(pathname: string, signedIn: boolean): "allow" | "unauthorized" {
  if (signedIn || isUnder(pathname, "/api/auth")) return "allow";
  return "unauthorized";
}
