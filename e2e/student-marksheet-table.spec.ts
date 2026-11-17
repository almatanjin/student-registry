import { expect, test, type Page } from "@playwright/test";
import { STUDENT, STUDENT_SESSION, seedPassword } from "./support/accounts";
import { testDatabase } from "./support/database";
import { signInAs } from "./support/sign-in";

// The seeded student Alma Tanjin has CS101 Programming Fundamentals released and CS102 Databases pending.

function marksheet(page: Page) {
  return page.getByRole("table", { name: "Your marksheet" });
}

function moduleRows(page: Page, code: string) {
  return marksheet(page).getByRole("rowgroup", { name: new RegExp(`^${code} `) });
}

/** The colour a setting in theme.css resolves to, in the same format the browser reports for an element. */
async function themeColour(page: Page, variable: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.backgroundColor = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, variable);
}

function background(locator: ReturnType<Page["locator"]>) {
  return locator.evaluate((element) => getComputedStyle(element).backgroundColor);
}

test.describe("Student marksheet is one table", () => {
  test.use({ storageState: STUDENT_SESSION });

  test("Released module on a wide screen", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/student/marksheet");

    const cs101 = moduleRows(page, "CS101");
    await expect(marksheet(page).getByRole("columnheader", { name: "Module" })).toBeVisible();
    await expect(cs101.getByRole("rowheader")).toHaveText(/CS101\s*Programming Fundamentals/);
    await expect(cs101.getByRole("rowheader")).toHaveCount(1);

    const lab = cs101.getByRole("row", { name: /Lab report 1/ });
    await expect(lab).toContainText("72");
    await expect(lab).toContainText("Distinction");
    const test_ = cs101.getByRole("row", { name: /Programming test/ });
    await expect(test_).toContainText("68");
    await expect(test_).toContainText("Merit");

    // The Module cell sits beside both assessment rows, so it is level with the first and reaches the second.
    const moduleBox = await cs101.getByRole("rowheader").boundingBox();
    const labBox = await lab.boundingBox();
    const testBox = await test_.boundingBox();
    expect(moduleBox?.y).toBeCloseTo(labBox?.y ?? -1, 0);
    expect((moduleBox?.y ?? 0) + (moduleBox?.height ?? 0)).toBeCloseTo((testBox?.y ?? 0) + (testBox?.height ?? 0), 0);
  });

  test("Modules in code order", async ({ page }) => {
    await page.goto("/student/marksheet");

    const names = await marksheet(page)
      .locator("tbody")
      .evaluateAll((groups) => groups.map((group) => group.getAttribute("aria-label")));
    expect(names).toEqual(["CS101 Programming Fundamentals", "CS102 Databases"]);
  });
});

test.describe("Unreleased modules in the marksheet table", () => {
  test.use({ storageState: STUDENT_SESSION });

  test("Pending module row", async ({ page }) => {
    await page.goto("/student/marksheet");

    const cs102 = moduleRows(page, "CS102");
    await expect(cs102.getByRole("row")).toHaveCount(1);
    // The only cell is the message, so no assessment titles, grades, or classifications are shown.
    await expect(cs102.getByRole("cell")).toHaveText(["Results not yet released"]);
  });
});

test.describe("Marksheet on phones", () => {
  test.use({ storageState: STUDENT_SESSION });

  test("Phone", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/student/marksheet");

    await expect(marksheet(page).getByRole("columnheader", { name: "Module" })).toBeHidden();
    const rows = moduleRows(page, "CS101").getByRole("row");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toHaveText(/CS101\s*Programming Fundamentals/);
    await expect(rows.nth(1)).toContainText("Lab report 1");
    await expect(rows.nth(2)).toContainText("Programming test");
    await expect(moduleRows(page, "CS101").getByRole("rowheader")).toHaveCount(1);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
  });
});

test.describe("Module code colours", () => {
  test.use({ storageState: STUDENT_SESSION });

  test("Two modules", async ({ page }) => {
    await page.goto("/student/marksheet");

    const badge = (code: string) => moduleRows(page, code).getByText(code, { exact: true }).filter({ visible: true });
    expect(await background(badge("CS101"))).toBe(await themeColour(page, "--app-card-yellow-badge"));
    expect(await background(badge("CS102"))).toBe(await themeColour(page, "--app-card-purple-badge"));
  });
});

test.describe("Grade bands legend", () => {
  test.use({ storageState: STUDENT_SESSION });

  test("Legend shown", async ({ page }) => {
    await page.goto("/student/marksheet");

    const main = page.getByRole("main");
    await expect(main.getByText("Bands:", { exact: true })).toBeVisible();
    await expect(main.getByRole("list", { name: "Grade bands" }).getByRole("listitem")).toHaveText([
      "Fail <40",
      "Pass 40+",
      "Merit 60+",
      "Distinction 70+",
    ]);
    await expect(main).not.toContainText("Results appear here once they have been released");
  });

  test("Legend matches the table", async ({ page }) => {
    await page.goto("/student/marksheet");

    const legendPill = page.getByRole("list", { name: "Grade bands" }).getByText("Distinction 70+", { exact: true });
    const tablePill = moduleRows(page, "CS101")
      .getByRole("row", { name: /Lab report 1/ })
      .getByText("Distinction", { exact: true });
    expect(await background(tablePill)).toBe(await background(legendPill));
  });
});

test.describe.serial("A student with no modules", () => {
  // No seeded programme is empty, so this arranges one in the database, with a student who signs in
  // with the seeded password, and removes both afterwards.
  const db = testDatabase();
  const EMAIL = "nadia.empty@e2e.example";
  let programmeId = "";

  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeAll(async () => {
    const seeded = await db.user.findUniqueOrThrow({ where: { email: STUDENT.email }, select: { passwordHash: true } });
    const programme = await db.programme.create({
      data: { code: "E2E-EMPTY", name: "Zz Empty Programme", annualFeeMinor: 100_000 },
    });
    programmeId = programme.id;
    await db.student.create({
      data: {
        studentNumber: "SMS-1900-0101",
        fullName: "Nadia Empty",
        dateOfBirth: new Date("2005-05-05"),
        academicYearStart: 2026,
        programme: { connect: { id: programme.id } },
        user: { create: { email: EMAIL, passwordHash: seeded.passwordHash, role: "STUDENT" } },
      },
    });
  });

  test.afterAll(async () => {
    if (programmeId) {
      const student = await db.student.findFirst({ where: { programmeId }, select: { userId: true } });
      await db.student.deleteMany({ where: { programmeId } });
      if (student) await db.user.delete({ where: { id: student.userId } });
      await db.programme.delete({ where: { id: programmeId } });
    }
    await db.$disconnect();
  });

  test("No modules", async ({ page }) => {
    await signInAs(page, EMAIL, seedPassword());
    await page.goto("/student/marksheet");

    await expect(page.getByText("No modules yet")).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.getByRole("list", { name: "Grade bands" })).toHaveCount(0);
  });
});
