import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

/**
 * A database client for the test database, for arranging records the app has no screen to create,
 * such as a module without assessments. Close it with `$disconnect()` when done.
 */
export function testDatabase(): PrismaClient {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set; copy .env.example to .env and fill it in.");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}
