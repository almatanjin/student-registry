import { prisma } from "@/server/db";
import { clearAllTables } from "@/server/maintenance";

/** Empties every application table so each test starts from a clean test database. */
export function resetDatabase() {
  return clearAllTables(prisma);
}
