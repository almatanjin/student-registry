import type { PrismaClient } from "@/generated/prisma/client";

/** Demo staff accounts. Their password is SEED_USER_PASSWORD from .env. */
export const STAFF_ACCOUNTS = [
  { email: "registrar@sms.example" },
  { email: "registry.officer@sms.example" },
] as const;

export async function seedStaff(prisma: PrismaClient, passwordHash: string) {
  const users = [];
  for (const { email } of STAFF_ACCOUNTS) {
    users.push(await prisma.user.create({ data: { email, passwordHash, role: "STAFF" } }));
  }
  return users;
}
