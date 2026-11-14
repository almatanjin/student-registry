import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { todayIn } from "../src/domain/dates";
import { runSeed } from "../prisma/seed/index";
import { E2E_UPLOAD_DIR } from "./support/paths";

/** Migrates the test database and loads fresh demo data before every Playwright run. */
export default async function globalSetup() {
  if (existsSync(".env")) process.loadEnvFile(".env");
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set; copy .env.example to .env and fill it in.");
  const password = process.env.SEED_USER_PASSWORD;
  if (!password) throw new Error("SEED_USER_PASSWORD is not set; add it to .env.");

  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    const timeZone = process.env.APP_TIMEZONE || "Europe/London";
    // Seeded submission files go where the app under test reads them.
    process.env.UPLOAD_DIR = E2E_UPLOAD_DIR;
    await runSeed(prisma, { today: todayIn(timeZone), password, timeZone });
  } finally {
    await prisma.$disconnect();
  }
}
