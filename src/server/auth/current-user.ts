import { auth } from "@/auth";
import type { CurrentUser } from "./types";

/**
 * The signed-in user for the current request, or null when signed out.
 * Everything that needs the session goes through here; integration tests set it at this boundary.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.role) return null;
  return { id: user.id, email: user.email, role: user.role, studentId: user.studentId ?? null };
}
