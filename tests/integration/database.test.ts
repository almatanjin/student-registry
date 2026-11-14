import { beforeEach, expect, test } from "vitest";
import { prisma } from "@/server/db";
import { resetDatabase } from "./helpers/database";

beforeEach(resetDatabase);

test("a programme can be saved and read back from the test database", async () => {
  await prisma.programme.create({
    data: { code: "BSC-CS", name: "BSc Computer Science", annualFeeMinor: 900_000 },
  });

  const saved = await prisma.programme.findUniqueOrThrow({ where: { code: "BSC-CS" } });

  expect(saved.name).toBe("BSc Computer Science");
  expect(saved.annualFeeMinor).toBe(900_000);
});

test("each test starts from an empty database", async () => {
  expect(await prisma.programme.count()).toBe(0);
});
