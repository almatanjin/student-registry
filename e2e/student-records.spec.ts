import { expect, test, type Page } from "@playwright/test";
import { academicYearOf } from "../src/domain/academic-year";
import { todayIn } from "../src/domain/dates";
import { STAFF_SESSION, STUDENT, STUDENT_SESSION } from "./support/accounts";

const currentYear = academicYearOf(todayIn(process.env.APP_TIMEZONE || "Europe/London"));
const previousYear = currentYear - 1;

function studentRows(page: Page) {
  return page.getByRole("table").getByRole("row").filter({ hasNot: page.getByRole("columnheader") });
}

test.describe("Staff search and filter the student list", () => {
  test.use({ storageState: STAFF_SESSION });

  test.beforeEach(async ({ page }) => {
    await page.goto("/staff/students");
  });

  test("the list shows every seeded student with its details", async ({ page }) => {
    await expect(studentRows(page)).toHaveCount(7);
    const row = studentRows(page).filter({ hasText: "Sofia Rossi" });
    await expect(row).toContainText(`SMS-${previousYear}-0002`);
    await expect(row).toContainText("MSc Data Science");
    await expect(row).toContainText(`${previousYear}/`);
    await expect(row).toContainText("Enrolled");
  });

  test("Search by part of a name", async ({ page }) => {
    await page.getByLabel("Search").fill("ROSS");

    await expect(studentRows(page)).toHaveCount(1);
    await expect(studentRows(page)).toContainText("Sofia Rossi");
  });

  test("Results update while typing", async ({ page }) => {
    const search = page.getByLabel("Search");
    await search.pressSequentially("ross");

    await expect(page).toHaveURL(/q=ross/);
    await expect(studentRows(page)).toHaveCount(1);
    await expect(studentRows(page)).toContainText("Sofia Rossi");
    await expect(search).toBeFocused();
    await expect(search).toHaveValue("ross");
    await expect(page.getByRole("button", { name: "Search" })).toHaveCount(0);
  });

  test("Search by Student ID", async ({ page }) => {
    await page.getByLabel("Search").fill(`${currentYear}-0001`);

    await expect(studentRows(page)).toHaveCount(1);
    await expect(studentRows(page)).toContainText("Alma Tanjin");
  });

  test("Combined filters", async ({ page }) => {
    await page.getByLabel("Programme").selectOption({ label: "BSc (Hons) Computer Science" });
    await page.getByLabel("Status").selectOption({ label: "Withdrawn" });

    await expect(studentRows(page)).toHaveCount(1);
    await expect(studentRows(page)).toContainText("Fatima Hassan");
  });

  test("No matches", async ({ page }) => {
    await page.getByLabel("Programme").selectOption({ label: "MSc Data Science" });
    await page.getByLabel("Status").selectOption({ label: "Withdrawn" });

    await expect(page.getByText("No students match these filters")).toBeVisible();
    await page.getByRole("link", { name: "Clear filters" }).first().click();

    await expect(page).toHaveURL(/\/staff\/students$/);
    await expect(studentRows(page)).toHaveCount(7);
  });

  test("Filters survive a reload", async ({ page }) => {
    await page.getByLabel("Search").fill("a");
    await page.getByLabel("Status").selectOption({ label: "Enrolled" });
    await expect(page).toHaveURL(/status=ENROLLED/);
    const before = await studentRows(page).allTextContents();

    await page.reload();

    await expect(page.getByLabel("Search")).toHaveValue("a");
    await expect(page.getByLabel("Status")).toHaveValue("ENROLLED");
    expect(await studentRows(page).allTextContents()).toEqual(before);
  });
});

test.describe("Staff create a student record", () => {
  test.use({ storageState: STAFF_SESSION });

  test("Missing or invalid fields", async ({ page }) => {
    await page.goto("/staff/students/new");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Initial password").fill("short");
    await page.getByRole("button", { name: "Create student" }).click();

    await expect(page.getByLabel("Full name")).toHaveAccessibleDescription("Enter the full name");
    await expect(page.getByLabel("Email")).toHaveAccessibleDescription("Enter a valid email address");
    await expect(page.getByLabel("Programme")).toHaveAccessibleDescription("Choose a programme");
    await expect(page.getByLabel("Date of birth")).toHaveAccessibleDescription("Enter the date of birth");
    await expect(page.getByLabel("Initial password")).toHaveAccessibleDescription("Use at least 8 characters");
    await expect(page).toHaveURL(/\/staff\/students\/new$/);
  });

  test("Duplicate email", async ({ page }) => {
    await page.goto("/staff/students/new");
    await fillNewStudent(page, { email: STUDENT.email.toUpperCase() });
    await page.getByRole("button", { name: "Create student" }).click();

    await expect(page.getByText("This email is already in use")).toBeVisible();
  });

  test("Duplicate email alongside other field errors", async ({ page }) => {
    await page.goto("/staff/students/new");
    await page.getByLabel("Email").fill(STUDENT.email.toUpperCase());
    await page.getByRole("button", { name: "Create student" }).click();

    await expect(page.getByLabel("Email")).toHaveAccessibleDescription("This email is already in use");
    await expect(page.getByLabel("Full name")).toHaveAccessibleDescription("Enter the full name");
    await expect(page).toHaveURL(/\/staff\/students\/new$/);
  });

  test("Valid new student", async ({ page }) => {
    await page.goto("/staff/students");
    await page.getByRole("link", { name: "Add student" }).click();
    await expect(page.getByLabel("Academic year")).toHaveValue(new RegExp(`^${currentYear}/`));
    await expect(page.getByLabel(/Student ID/)).toHaveCount(0);

    await fillNewStudent(page, { email: "grace.adeyemi@students.sms.example" });
    await page.getByRole("button", { name: "Create student" }).click();

    await expect(page.getByRole("heading", { name: "Grace Adeyemi" })).toBeVisible();
    await expect(page.getByText(new RegExp(`^SMS-${currentYear}-\\d{4}$`)).first()).toBeVisible();
    await expect(page.getByRole("main").getByText("grace.adeyemi@students.sms.example")).toBeVisible();
  });

  test("Editing details", async ({ page }) => {
    await page.goto("/staff/students?q=Noah");
    await page.getByRole("link", { name: "Noah Williams" }).click();
    const studentId = await page.getByText(/^SMS-\d{4}-\d{4}$/).first().textContent();
    await page.getByRole("link", { name: "Edit" }).click();

    await page.getByLabel("Full name").fill("Noah J. Williams");
    await page.getByLabel("Enrolment status").selectOption({ label: "Enrolled" });
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByRole("heading", { name: "Noah J. Williams" })).toBeVisible();
    await expect(page.getByText(studentId ?? "missing").first()).toBeVisible();
    await expect(page.getByText("Enrolled").first()).toBeVisible();
  });
});

async function fillNewStudent(page: Page, overrides: { email: string }) {
  await page.getByLabel("Full name").fill("Grace Adeyemi");
  await page.getByLabel("Email").fill(overrides.email);
  await page.getByLabel("Date of birth").fill("2006-08-19");
  await page.getByLabel("Programme").selectOption({ label: "MSc Data Science" });
  await page.getByLabel("Initial password").fill("grace-first-login");
}

test.describe("Students view their own record", () => {
  test.use({ storageState: STUDENT_SESSION });

  test("Student profile", async ({ page }) => {
    await page.goto("/student/profile");
    const main = page.getByRole("main");

    await expect(main.getByText(STUDENT.fullName)).toBeVisible();
    await expect(main.getByText(STUDENT.email)).toBeVisible();
    await expect(main.getByText(new RegExp(`^SMS-${currentYear}-0001$`))).toBeVisible();
    await expect(main.getByRole("button")).toHaveCount(0);
    await expect(main.getByRole("textbox")).toHaveCount(0);
    await expect(main.getByRole("link", { name: /edit/i })).toHaveCount(0);
  });

  test("Student opens a staff page", async ({ page }) => {
    await page.goto("/staff/students");

    await expect(page).toHaveURL(/\/student\/assessments$/);
  });
});
