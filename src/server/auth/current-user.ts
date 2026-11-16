import { auth } from "@/auth";
import { prisma } from "@/server/db";
import type { CurrentUser } from "./types";

/**
 * The signed-in user for the current request, or null when signed out.
 * The session is checked against the account on every call: a session started before the
 * latest password change or reset counts as signed out, and the must-change flag is read fresh.
 * Everything that needs the session goes through here; integration tests set it at this boundary.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.role) return null;

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordVersion: true, mustChangePassword: true },
  });
  if (!account || account.passwordVersion !== user.passwordVersion) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    studentId: user.studentId ?? null,
    mustChangePassword: account.mustChangePassword,
  };
}
