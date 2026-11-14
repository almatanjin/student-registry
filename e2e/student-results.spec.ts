import { expect, test, type Page } from "@playwright/test";
import { SEED_STUDENTS } from "../prisma/seed/students";
import { STAFF_SESSION, STUDENT_SESSION, seedPassword } from "./support/accounts";
import { signInAs } from "./support/sign-in";

function moduleCard(page: Page, code: string) {
  return page.getByRole("region", { name: new RegExp(`^${code} `) });
}

async function openMarksheet(page: Page, assessment: string) {
  await page.goto("/staff/assessments");
  await page.getByRole("link", { name: assessment, exact: true }).click();
  await expect(page.getByRole("heading", { name: assessment })).toBeVisible();
}

function marksheetRow(page: Page, student: string) {
  return page.getByRole("table", { name: "Submissions" }).getByRole("row", { name: new RegExp(student) });
}

test.describe("Students see only published results", () => {
  test.use({ storageState: STUDENT_SESSION });

  test("Published module", async ({ page }) => {
    await page.goto("/student/marksheet");

    const cs101 = moduleCard(page, "CS101");
    await expect(cs101.getByRole("row", { name: /Lab report 1/ })).toContainText("72");
    await expect(cs101.getByRole("row", { name: /Lab report 1/ })).toContainText("Distinction");
    await expect(cs101.getByRole("row", { name: /Programming test/ })).toContainText("68");
    await expect(cs101.getByRole("row", { name: /Programming test/ })).toContainText("Merit");
  });

  test("a Pending module shows that results are not yet released", async ({ page }) => {
    await page.goto("/student/marksheet");

    await expect(moduleCard(page, "CS102")).toContainText("Results not yet released");
    await expect(moduleCard(page, "CS102").getByRole("table")).toHaveCount(0);
  });
});

test("Withheld module", async ({ page }) => {
  const liam = SEED_STUDENTS.find((student) => student.fullName === "Liam Chen");
  await signInAs(page, liam?.email ?? "", seedPassword());
  await page.goto("/student/marksheet");

  await expect(moduleCard(page, "CS101")).toContainText("Results not yet released");
  await expect(moduleCard(page, "CS102")).toContainText("Results not yet released");
  await expect(page.getByRole("main")).not.toContainText(/withheld/i);
  await expect(page.getByRole("main")).not.toContainText("55");
});

test.describe("Staff enter grades", () => {
  test.use({ storageState: STAFF_SESSION });

  test("Out-of-range or non-numeric grade", async ({ page }) => {
    await openMarksheet(page, "Lab report 1");
    const grade = page.getByLabel("Grade for Priya Patel");

    await grade.fill("101");
    await marksheetRow(page, "Priya Patel").getByRole("button", { name: "Save" }).click();

    await expect(grade).toHaveAccessibleDescription("Enter a whole number from 0 to 100");
  });

  test("Entering a grade, for a Student with no submission", async ({ page }) => {
    await openMarksheet(page, "Lab report 1");
    await expect(marksheetRow(page, "Priya Patel")).toContainText("Not submitted");

    await page.getByLabel("Grade for Priya Patel").fill("45");
    await marksheetRow(page, "Priya Patel").getByRole("button", { name: "Save" }).click();

    await expect(marksheetRow(page, "Priya Patel")).toContainText("Pass");
    await page.reload();
    await expect(page.getByLabel("Grade for Priya Patel")).toHaveValue("45");
  });

  test("Correcting a published grade", async ({ page, browser }) => {
    await openMarksheet(page, "Lab report 1");
    await page.getByLabel("Grade for Amara Okafor").fill("69");
    await marksheetRow(page, "Amara Okafor").getByRole("button", { name: "Save" }).click();

    const warning = marksheetRow(page, "Amara Okafor").getByRole("alert");
    await expect(warning).toContainText("This result is already released");
    await warning.getByRole("button", { name: "Save anyway" }).click();
    await expect(marksheetRow(page, "Amara Okafor")).toContainText("Merit");

    const student = await browser.newContext({ storageState: STUDENT_SESSION });
    const studentPage = await student.newPage();
    await studentPage.goto("/student/marksheet");
    const lab = moduleCard(studentPage, "CS101").getByRole("row", { name: /Lab report 1/ });
    await expect(lab).toContainText("69");
    await expect(lab).toContainText("Merit");
    await student.close();
  });
});

test.describe("Staff publish and withhold results", () => {
  test.use({ storageState: STAFF_SESSION });

  test("Bulk publish skips withheld and incomplete results", async ({ page }) => {
    await page.goto("/staff/results");
    await page.getByRole("link", { name: /CS101 Programming Fundamentals/ }).click();
    const results = page.getByRole("table", { name: "Module results" });

    await expect(results.getByRole("row", { name: /Liam Chen/ })).toContainText("Withheld");
    await expect(results.getByRole("row", { name: /Fatima Hassan/ })).toContainText("Missing: Programming test, Lab report 1");
    await expect(page.getByRole("group", { name: "Result actions for Fatima Hassan" }).getByRole("button", { name: "Publish" })).toBeDisabled();

    await page.getByRole("button", { name: "Publish all complete results" }).click();

    await expect(page.getByRole("status")).toContainText("1 published, 3 skipped");
    await expect(results.getByRole("row", { name: /Priya Patel/ })).toContainText("Published");
    await expect(results.getByRole("row", { name: /Liam Chen/ })).toContainText("Withheld");
  });

  test("Withholding a published result", async ({ page }) => {
    await page.goto("/staff/results");
    await page.getByRole("link", { name: /CS101 Programming Fundamentals/ }).click();

    await page.getByRole("group", { name: "Result actions for Priya Patel" }).getByRole("button", { name: "Withhold" }).click();

    await expect(
      page.getByRole("table", { name: "Module results" }).getByRole("row", { name: /Priya Patel/ }),
    ).toContainText("Withheld");
  });
});
