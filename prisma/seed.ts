// Entry point for `prisma db seed`. Replaces the database contents with demo data.
import { prisma } from "@/server/db";
import { appTimeZone, today } from "@/server/config";
import { runSeed } from "./seed/index";

async function main() {
  const password = process.env.SEED_USER_PASSWORD;
  if (!password) throw new Error("SEED_USER_PASSWORD is not set; add it to .env.");

  const result = await runSeed(prisma, { today: today(), password, timeZone: appTimeZone() });
  console.log(
    `Seeded ${result.programmes.length} programmes, ${result.staff.length} staff accounts, ${result.students.length} students, ${result.payments} payments, ${result.assessments.length} assessments, and ${result.grades} grades.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
