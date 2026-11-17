import { expect, test, type Browser } from "@playwright/test";
import { STAFF_SESSION, STUDENT, seedPassword } from "./support/accounts";
import { testDatabase } from "./support/database";
import { signInAs } from "./support/sign-in";

// The seeded modules are shared with other specs, so this file arranges a programme of its own:
// ZZ301 with one graded assessment whose result is Published, and ZZ302 with no results.
// A student on it signs in with the seeded password. Everything is removed afterwards.
const db = testDatabase();
const PUBLISHED_MODULE = { code: "ZZ301", title: "Reopen Practice" };
const QUIET_MODULE = { code: "ZZ302", title: "Quiet Practice" };
const EMAIL = "rosa.reopen@e2e.example";
let programmeId = "";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const seeded = await db.user.findUniqueOrThrow({ where: { email: STUDENT.email }, select: { passwordHash: true } });
  const programme = await db.programme.create({
    data: {
      code: "E2E-REOPEN",
      name: "Zz Reopen Programme",
      annualFeeMinor: 100_000,
      modules: {
        create: [
          { ...PUBLISHED_MODULE, assessments: { create: { title: "Reopen task 1", deadline: new Date("2026-10-01T12:00:00Z") } } },
          QUIET_MODULE,
        ],
      },
    },
    include: { modules: { include: { assessments: true } } },
  });
  programmeId = programme.id;
  const published = programme.modules.find((module_) => module_.code === PUBLISHED_MODULE.code);
  if (!published) throw new Error("module was not created");
  await db.student.create({
    data: {
      studentNumber: "SMS-1900-0201",
      fullName: "Rosa Reopen",
      dateOfBirth: new Date("2005-05-05"),
      academicYearStart: 2026,
      programme: { connect: { id: programme.id } },
      user: { create: { email: EMAIL, passwordHash: seeded.passwordHash, role: "STUDENT" } },
      grades: { create: { assessmentId: published.assessments[0].id, value: 72 } },
      moduleResults: { create: { moduleId: published.id, state: "PUBLISHED" } },
    },
  });
});

test.afterAll(async () => {
  if (programmeId) {
    const students = { programmeId };
    const userIds = (await db.student.findMany({ where: students, select: { userId: true } })).map((row) => row.userId);
    await db.grade.deleteMany({ where: { student: students } });
    await db.moduleResult.deleteMany({ where: { student: students } });
    await db.submission.deleteMany({ where: { student: students } });
    await db.studentInstalment.deleteMany({ where: { student: students } });
    await db.student.deleteMany({ where: students });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.assessment.deleteMany({ where: { module: { programmeId } } });
    await db.module.deleteMany({ where: { programmeId } });
    await db.programme.delete({ where: { id: programmeId } });
  }
  await db.$disconnect();
});

async function staffPage(browser: Browser) {
  const context = await browser.newContext({ storageState: STAFF_SESSION });
  return { context, page: await context.newPage() };
}

function moduleOption(code: string, title: string) {
  return `${code} ${title}`;
}

test.describe("Adding an assessment reopens published results", () => {
  test("No warning without published results", async ({ browser }) => {
    const { context, page } = await staffPage(browser);
    await page.goto("/staff/assessments/new");

    await page.getByLabel("Module").selectOption({ label: moduleOption(QUIET_MODULE.code, QUIET_MODULE.title) });

    await expect(page.getByText(/will return to Pending/)).toHaveCount(0);
    await context.close();
  });

  test("Warning before creating", async ({ browser }) => {
    const { context, page } = await staffPage(browser);
    await page.goto("/staff/assessments/new");

    await page.getByLabel("Module").selectOption({ label: moduleOption(PUBLISHED_MODULE.code, PUBLISHED_MODULE.title) });

    await expect(page.getByText("1 published ZZ301 result will return to Pending.")).toBeVisible();
    await context.close();
  });

  test("New assessment in a published module", async ({ browser, page }) => {
    await signInAs(page, EMAIL, seedPassword());
    await page.goto("/student/marksheet");
    const zz301 = page.getByRole("table", { name: "Your marksheet" }).getByRole("rowgroup", { name: /^ZZ301 / });
    await expect(zz301.getByRole("row", { name: /Reopen task 1/ })).toContainText("72");

    const staff = await staffPage(browser);
    await staff.page.goto("/staff/assessments/new");
    await staff.page.getByLabel("Title").fill("Reopen task 2");
    await staff.page.getByLabel("Module").selectOption({ label: moduleOption(PUBLISHED_MODULE.code, PUBLISHED_MODULE.title) });
    await staff.page.getByLabel("Submission deadline").fill("2027-06-01T17:00");
    await staff.page.getByRole("button", { name: "Create assessment" }).click();
    await expect(staff.page.getByRole("heading", { name: "Reopen task 2" })).toBeVisible();
    await staff.context.close();

    await page.reload();
    await expect(zz301.getByRole("row")).toHaveCount(1);
    await expect(zz301).toContainText("Results not yet released");
  });
});
