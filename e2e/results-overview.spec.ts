import { expect, test, type Page } from "@playwright/test";
import { STAFF_SESSION } from "./support/accounts";
import { testDatabase } from "./support/database";

test.use({ storageState: STAFF_SESSION });

const PILL =
  /^(No assessments yet|No students yet|\d+ ready to publish|Waiting for grades|\d+ withheld|All published)$/;

function modules(page: Page) {
  return page.getByRole("list", { name: "Modules" });
}

function card(page: Page, code: string) {
  return modules(page).getByRole("link", { name: new RegExp(`^${code} `) });
}

function pillOf(page: Page, code: string) {
  return card(page, code).locator('[data-slot="module-result-status"]');
}

/** Records a grade on the given assessment's page and waits for its classification to show. */
async function grade(page: Page, assessment: string, student: string, value: string, classification: string) {
  await page.goto("/staff/assessments");
  await page.getByRole("link", { name: assessment, exact: true }).click();
  const row = page.getByRole("table", { name: "Submissions" }).getByRole("row", { name: new RegExp(student) });
  await page.getByLabel(`Grade for ${student}`).fill(value);
  await row.getByRole("button", { name: "Save" }).click();
  await expect(row).toContainText(classification);
}

async function openModuleResults(page: Page, code: string, title: string) {
  await page.goto("/staff/results");
  await card(page, code).click();
  await expect(page.getByRole("heading", { name: `${code} ${title}` })).toBeVisible();
}

async function setResult(page: Page, student: string, action: "Publish" | "Withhold", shows: string) {
  await page
    .getByRole("group", { name: `Result actions for ${student}` })
    .getByRole("button", { name: action, exact: true })
    .click();
  await expect(
    page.getByRole("table", { name: "Module results" }).getByRole("row", { name: new RegExp(student) }),
  ).toContainText(shows);
}

test.describe("Staff see each module as a card on the results overview", () => {
  test("Card contents", async ({ page }) => {
    await page.goto("/staff/results");

    const expected = [
      {
        code: "CS101",
        title: "Programming Fundamentals",
        programme: "BSc (Hons) Computer Science",
      },
      {
        code: "CS102",
        title: "Databases",
        programme: "BSc (Hons) Computer Science",
      },
      {
        code: "DS501",
        title: "Statistical Learning",
        programme: "MSc Data Science",
      },
      {
        code: "DS502",
        title: "Data Engineering",
        programme: "MSc Data Science",
      },
    ];
    for (const { code, title, programme } of expected) {
      const item = card(page, code);
      await expect(item).toContainText(title);
      await expect(item).toContainText(new RegExp(`${programme.replace(/[()]/g, "\\$&")} · \\d+ assessments?`));
      await expect(item).toContainText("View results");
      await expect(item.locator('[data-slot="module-result-status"]')).toHaveCount(1);
      await expect(item.locator('[data-slot="module-result-status"]')).toHaveText(PILL);
    }
  });

  test("Opening a module", async ({ page }) => {
    await page.goto("/staff/results");

    await card(page, "CS101").click();

    await expect(page).toHaveURL(/\/staff\/results\/[^/]+$/);
    await expect(page.getByRole("heading", { name: "CS101 Programming Fundamentals" })).toBeVisible();
  });

  test("Phone layout", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/staff/results");

    const boxes = await modules(page)
      .getByRole("listitem")
      .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().left));
    expect(boxes.length).toBeGreaterThan(1);
    expect(new Set(boxes).size).toBe(1);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
});

test.describe.serial("The card's status pill says what the module needs next", () => {
  // Other specs in the run add students to the seeded programmes, so these tests use a programme of their own:
  // one module with one assessment and three students, arranged in the database because the app has no screen for it.
  const db = testDatabase();
  const MODULE = { code: "ZZ201", title: "Pill Practice" };
  const TASK = "Pill practice task";
  let programmeId = "";

  test.beforeAll(async () => {
    const programme = await db.programme.create({
      data: {
        code: "E2E-PILLS",
        name: "Zz Pill Programme",
        annualFeeMinor: 100_000,
        modules: {
          create: {
            ...MODULE,
            assessments: { create: { title: TASK, deadline: new Date("2027-06-01T12:00:00Z"), isOpen: true } },
          },
        },
      },
    });
    programmeId = programme.id;
    for (const [index, fullName] of ["Ada Pill", "Ben Pill", "Cy Pill"].entries()) {
      await db.student.create({
        data: {
          studentNumber: `SMS-1900-${String(index + 1).padStart(4, "0")}`,
          fullName,
          dateOfBirth: new Date("2005-05-05"),
          academicYearStart: 2026,
          programme: { connect: { id: programme.id } },
          user: {
            create: {
              email: `${fullName.toLowerCase().replace(" ", ".")}@e2e.example`,
              passwordHash: "not-used",
              role: "STUDENT",
            },
          },
        },
      });
    }
  });

  test.afterAll(async () => {
    if (programmeId) {
      const students = { programmeId };
      await db.grade.deleteMany({ where: { student: students } });
      await db.moduleResult.deleteMany({ where: { student: students } });
      const userIds = (await db.student.findMany({ where: students, select: { userId: true } })).map(
        (row) => row.userId,
      );
      await db.student.deleteMany({ where: students });
      await db.user.deleteMany({ where: { id: { in: userIds } } });
      await db.assessment.deleteMany({ where: { module: { programmeId } } });
      await db.module.deleteMany({ where: { programmeId } });
      await db.programme.delete({ where: { id: programmeId } });
    }
    await db.$disconnect();
  });

  test("Only incomplete results left", async ({ page }) => {
    await page.goto("/staff/results");

    await expect(pillOf(page, MODULE.code)).toHaveText("Waiting for grades");
  });

  test("Results ready to publish", async ({ page }) => {
    await grade(page, TASK, "Ada Pill", "64", "Merit");
    await grade(page, TASK, "Ben Pill", "71", "Distinction");
    await page.goto("/staff/results");

    await expect(pillOf(page, MODULE.code)).toHaveText("2 ready to publish");
  });

  test("Pills agree with the dashboard", async ({ page }) => {
    await page.goto("/staff/results");
    const pills = await modules(page).locator('[data-slot="module-result-status"]').allTextContents();
    const ready = pills.reduce((sum, text) => sum + Number(/^(\d+) ready to publish$/.exec(text)?.[1] ?? 0), 0);
    expect(ready).toBeGreaterThan(0);

    await page.goto("/staff/dashboard");

    await expect(
      page.getByRole("region", { name: "Results to publish" }).locator('[data-slot="stat-value"]'),
    ).toHaveText(String(ready));
  });

  test("Publishing updates the pill", async ({ page }) => {
    await openModuleResults(page, MODULE.code, MODULE.title);
    await page.getByRole("button", { name: "Publish all complete results" }).click();
    await expect(page.getByRole("status")).toContainText("2 published, 1 skipped");

    await page.goto("/staff/results");

    await expect(pillOf(page, MODULE.code)).toHaveText("Waiting for grades");
  });

  test("Nothing left except withheld results", async ({ page }) => {
    await openModuleResults(page, MODULE.code, MODULE.title);
    await setResult(page, "Cy Pill", "Withhold", "Withheld");

    await page.goto("/staff/results");

    await expect(pillOf(page, MODULE.code)).toHaveText("1 withheld");
  });

  test("Everything published", async ({ page }) => {
    await grade(page, TASK, "Cy Pill", "58", "Pass");
    await openModuleResults(page, MODULE.code, MODULE.title);
    await setResult(page, "Cy Pill", "Publish", "Published");

    await page.goto("/staff/results");

    await expect(pillOf(page, MODULE.code)).toHaveText("All published");
  });
});

test.describe("Modules the seed data does not cover", () => {
  const db = testDatabase();
  let programmeId = "";

  test.beforeAll(async () => {
    // The app has no screen for adding programmes or modules, so these are arranged in the database.
    const programme = await db.programme.create({
      data: {
        code: "E2E-EMPTY",
        name: "Zz Empty Programme",
        annualFeeMinor: 100_000,
        modules: {
          create: [
            { code: "ZZ101", title: "Module Without Assessments" },
            {
              code: "ZZ102",
              title: "Module Without Students",
              assessments: {
                create: {
                  title: "Unattempted task",
                  deadline: new Date("2027-06-01T12:00:00Z"),
                  isOpen: true,
                },
              },
            },
          ],
        },
      },
    });
    programmeId = programme.id;
  });

  test.afterAll(async () => {
    if (programmeId) {
      await db.assessment.deleteMany({ where: { module: { programmeId } } });
      await db.module.deleteMany({ where: { programmeId } });
      await db.programme.delete({ where: { id: programmeId } });
    }
    await db.$disconnect();
  });

  test("Module without assessments", async ({ page }) => {
    await page.goto("/staff/results");

    await expect(card(page, "ZZ101")).toContainText("0 assessments");
    await expect(pillOf(page, "ZZ101")).toHaveText("No assessments yet");
  });

  test("Programme without students", async ({ page }) => {
    await page.goto("/staff/results");

    await expect(card(page, "ZZ102")).toContainText("1 assessment");
    await expect(pillOf(page, "ZZ102")).toHaveText("No students yet");
  });
});
