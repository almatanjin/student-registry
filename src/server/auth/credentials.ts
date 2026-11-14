import { prisma } from "@/server/db";
import { hashPassword, verifyPassword } from "./password";
import type { CurrentUser } from "./types";

// Compared against when the email is unknown, so both failures take about the same time.
const unknownUserHash = hashPassword("unknown-user-placeholder");

/**
 * Checks an email and password. Returns the account on success and null on any failure,
 * without saying whether the email exists.
 */
export async function verifyCredentials(email: unknown, password: unknown): Promise<CurrentUser | null> {
  if (typeof email !== "string" || typeof password !== "string") return null;
  const normalisedEmail = email.trim().toLowerCase();
  if (!normalisedEmail || !password) return null;

  const user = await prisma.user.findUnique({
    where: { email: normalisedEmail },
    select: { id: true, email: true, role: true, passwordHash: true, student: { select: { id: true } } },
  });

  const matches = await verifyPassword(password, user?.passwordHash ?? (await unknownUserHash));
  if (!user || !matches) return null;

  return { id: user.id, email: user.email, role: user.role, studentId: user.student?.id ?? null };
}
