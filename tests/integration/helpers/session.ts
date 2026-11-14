import type { CurrentUser } from "@/server/auth/types";

/**
 * The signed-in user that `getCurrentUser()` returns in integration tests.
 * This is the one agreed test seam for sessions (design.md, test seams).
 */
export const session: { user: CurrentUser | null } = { user: null };

export function actAs(user: CurrentUser | null) {
  session.user = user;
}

export function staffUser(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return { id: "staff-user", email: "staff@sms.example", role: "STAFF", studentId: null, ...overrides };
}

export function studentUser(studentId: string, overrides: Partial<CurrentUser> = {}): CurrentUser {
  return { id: `user-${studentId}`, email: `${studentId}@sms.example`, role: "STUDENT", studentId, ...overrides };
}
