import type { PrismaClient } from "@/generated/prisma/client";

/** Two demo programmes with their modules and fee plans. Amounts are in pence. */
export const PROGRAMMES = [
  {
    code: "BSC-CS",
    name: "BSc (Hons) Computer Science",
    annualFeeMinor: 900_000,
    feePlan: [
      { sequence: 1, amountMinor: 300_000, dueMonth: 10, dueDay: 1 },
      { sequence: 2, amountMinor: 300_000, dueMonth: 1, dueDay: 15 },
      { sequence: 3, amountMinor: 300_000, dueMonth: 4, dueDay: 15 },
    ],
    modules: [
      { code: "CS101", title: "Programming Fundamentals" },
      { code: "CS102", title: "Databases" },
    ],
  },
  {
    code: "MSC-DS",
    name: "MSc Data Science",
    annualFeeMinor: 1_200_000,
    feePlan: [
      { sequence: 1, amountMinor: 600_000, dueMonth: 10, dueDay: 1 },
      { sequence: 2, amountMinor: 600_000, dueMonth: 2, dueDay: 1 },
    ],
    modules: [
      { code: "DS501", title: "Statistical Learning" },
      { code: "DS502", title: "Data Engineering" },
    ],
  },
] as const;

export async function seedProgrammes(prisma: PrismaClient) {
  const created = [];
  for (const programme of PROGRAMMES) {
    created.push(
      await prisma.programme.create({
        data: {
          code: programme.code,
          name: programme.name,
          annualFeeMinor: programme.annualFeeMinor,
          feePlan: { create: programme.feePlan.map((instalment) => ({ ...instalment })) },
          modules: { create: programme.modules.map((row) => ({ ...row })) },
        },
        include: { feePlan: true, modules: true },
      }),
    );
  }
  return created;
}
