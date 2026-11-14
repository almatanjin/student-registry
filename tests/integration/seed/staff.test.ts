import { readFileSync } from "node:fs";
import { beforeAll, expect, test } from "vitest";
import { prisma } from "@/server/db";
import { verifyCredentials } from "@/server/auth/credentials";
import { runSeed } from "../../../prisma/seed/index";
import { STAFF_ACCOUNTS } from "../../../prisma/seed/staff";

const PASSWORD = "seed-test-password";

beforeAll(async () => {
  await runSeed(prisma, { today: "2026-11-14", password: PASSWORD });
});

test("the seed creates two staff accounts", async () => {
  expect(STAFF_ACCOUNTS).toHaveLength(2);
  expect(await prisma.user.count({ where: { role: "STAFF" } })).toBe(2);
});

test.each(STAFF_ACCOUNTS.map((account) => account.email))("seeded staff account %s can sign in", async (email) => {
  expect(await verifyCredentials(email, PASSWORD)).toMatchObject({ email, role: "STAFF" });
});

test("the seed requires a password of at least 8 characters", async () => {
  await expect(runSeed(prisma, { today: "2026-11-14", password: "short" })).rejects.toThrow(/at least 8/);
});

test("no seeded password is written in the seed script or the README", () => {
  const files = ["prisma/seed.ts", "prisma/seed/index.ts", "prisma/seed/staff.ts", "README.md"];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    expect(text).not.toMatch(/password\s*[:=]\s*["'][^"'$]{4,}["']/i);
  }
});

test("the README lists every seeded staff email", () => {
  const readme = readFileSync("README.md", "utf8");
  for (const { email } of STAFF_ACCOUNTS) expect(readme).toContain(email);
});
