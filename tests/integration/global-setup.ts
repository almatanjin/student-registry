import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

/** Brings the test database up to the latest migration once per run. */
export default function setup() {
  if (existsSync(".env")) process.loadEnvFile(".env");
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is not set; copy .env.example to .env and fill it in.");
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });
}
