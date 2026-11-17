import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { SEED_STUDENTS } from "../prisma/seed/students";
import { STAFF_SESSION, STUDENT_SESSION, seedPassword } from "./support/accounts";
import { signInAs } from "./support/sign-in";

const FIXTURES = path.join(import.meta.dirname, "..", "tests", "fixtures");

function localDateTime(daysFromNow: number) {
  const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return `${date.toISOString().slice(0, 10)}T17:00`;
}

async function openStudentAssessment(page: Page, title: string) {
  await page.goto("/student/assessments");
  await page.getByRole("list", { name: "Your assessments" }).getByRole("link", { name: new RegExp(title) }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
}

function yourSubmission(page: Page) {
  return page.getByRole("region", { name: "Your submission", exact: true });
}

test.describe("Staff create assessments", () => {
  test.use({ storageState: STAFF_SESSION });

  test("Deadline in the past", async ({ page }) => {
    await page.goto("/staff/assessments/new");
    await page.getByLabel("Title").fill("Back-dated quiz");
    await page.getByLabel("Module").selectOption({ label: "CS101 Programming Fundamentals" });
    await page.getByLabel("Submission deadline").fill(localDateTime(-2));
    await page.getByRole("button", { name: "Create assessment" }).click();

    await expect(page.getByLabel("Submission deadline")).toHaveAccessibleDescription("The deadline must be in the future");
  });

  test("Valid assessment, then Closing an assessment", async ({ page }) => {
    await page.goto("/staff/assessments");
    await page.getByRole("link", { name: "New assessment" }).click();
    await page.getByLabel("Title").fill("E2E reflective log");
    // CS102, so the CS101 results tests keep a fixed set of assessments.
    await page.getByLabel("Module").selectOption({ label: "CS102 Databases" });
    await page.getByLabel("Submission deadline").fill(localDateTime(5));
    await page.getByRole("button", { name: "Create assessment" }).click();

    await expect(page.getByRole("heading", { name: "E2E reflective log" })).toBeVisible();
    await expect(page.getByText("Open", { exact: true })).toBeVisible();
    await expect(page.getByRole("group", { name: "Missing" })).toContainText("4");

    await page.getByRole("button", { name: "Close for submissions" }).click();
    await expect(page.getByRole("button", { name: "Reopen for submissions" })).toBeVisible();
    await expect(page.getByText("Closed", { exact: true })).toBeVisible();
  });

  test("Mixed submissions", async ({ page }) => {
    await page.goto("/staff/assessments");
    await page.getByRole("link", { name: "Lab report 1" }).click();

    await expect(page.getByRole("group", { name: "On time" })).toContainText("1");
    await expect(page.getByRole("group", { name: "Late" })).toContainText("1");
    await expect(page.getByRole("group", { name: "Missing" })).toContainText("2");
    const rows = page.getByRole("table", { name: "Submissions" });
    await expect(rows.getByRole("row", { name: /Liam Chen/ })).toContainText("Late");
    await expect(rows.getByRole("row", { name: /Alma Tanjin/ })).toContainText("On time");
    await expect(rows.getByRole("row", { name: /Priya Kabir/ })).toContainText("Not submitted");
  });

  test("Extending a deadline", async ({ page }) => {
    await page.goto("/staff/assessments");
    await page.getByRole("link", { name: "Lab report 1" }).click();
    await page.getByRole("link", { name: "Edit" }).click();
    await page.getByLabel("Submission deadline").fill(localDateTime(60));
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByRole("heading", { name: "Lab report 1" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Late" })).toContainText("0");
    await expect(page.getByRole("group", { name: "On time" })).toContainText("2");

    // Put the original deadline back for the student tests that follow.
    await page.getByRole("link", { name: "Edit" }).click();
    await page.getByLabel("Submission deadline").fill(localDateTime(-21));
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("group", { name: "Late" })).toContainText("1");
  });
});

test.describe("Students upload one PDF or DOCX file", () => {
  test.use({ storageState: STUDENT_SESSION });

  test("Assessment list", async ({ page }) => {
    await page.goto("/student/assessments");
    const list = page.getByRole("list", { name: "Your assessments" });

    await expect(list.getByRole("link", { name: /Lab report 1/ })).toContainText("On time");
    await expect(list.getByRole("link", { name: /Databases coursework/ })).toContainText("Not submitted");
    await expect(list.getByRole("link", { name: /Pipeline design/ })).toHaveCount(0);
  });

  test("Wrong file type", async ({ page }) => {
    await openStudentAssessment(page, "Normalisation exercise");
    await page.getByLabel("Your file").setInputFiles(path.join(FIXTURES, "sample.png"));
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByLabel("Your file")).toHaveAccessibleDescription("Upload a PDF or DOCX file");
  });

  test("Valid upload, then Resubmitting before the deadline", async ({ page }) => {
    await openStudentAssessment(page, "Normalisation exercise");
    await page.getByLabel("Your file").setInputFiles(path.join(FIXTURES, "sample.pdf"));
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByText("sample.pdf was submitted.")).toBeVisible();
    await expect(yourSubmission(page)).toContainText("On time");
    await expect(yourSubmission(page).getByRole("link", { name: "sample.pdf" })).toBeVisible();

    await page.getByLabel("Replace your file").setInputFiles(path.join(FIXTURES, "sample.docx"));
    await page.getByRole("button", { name: "Replace submission" }).click();

    await expect(yourSubmission(page).getByRole("link", { name: "sample.docx" })).toBeVisible();
    await expect(yourSubmission(page).getByRole("link", { name: "sample.pdf" })).toHaveCount(0);
  });

  test("Student downloads their own file", async ({ page }) => {
    await openStudentAssessment(page, "Normalisation exercise");

    const downloading = page.waitForEvent("download");
    await yourSubmission(page).getByRole("link", { name: "sample.docx" }).click();

    expect((await downloading).suggestedFilename()).toBe("sample.docx");
  });

  test("First submission after the deadline", async ({ page }) => {
    await openStudentAssessment(page, "Databases coursework");
    await expect(page.getByText("You can still submit, but your work will be marked late.")).toBeVisible();

    await page.getByLabel("Your file").setInputFiles(path.join(FIXTURES, "sample.pdf"));
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByText("sample.pdf was submitted after the deadline and is marked late.")).toBeVisible();
    await expect(yourSubmission(page)).toContainText("Late");
  });

  test("Resubmitting after the deadline", async ({ page }) => {
    await openStudentAssessment(page, "Lab report 1");

    await expect(page.getByText("The deadline has passed", { exact: true })).toBeVisible();
    await expect(page.getByText("Your submission is kept, but it can no longer be replaced.")).toBeVisible();
    await expect(page.getByRole("button", { name: /Replace submission|Submit/ })).toHaveCount(0);
  });

  test("Closed assessment", async ({ page }) => {
    await openStudentAssessment(page, "E2E reflective log");

    await expect(page.getByText("This assessment is closed")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toHaveCount(0);
  });
});

test("Student not currently enrolled", async ({ page }) => {
  const noah = SEED_STUDENTS.find((student) => student.status === "DEFERRED");
  await signInAs(page, noah?.email ?? "", seedPassword());
  await openStudentAssessment(page, "Pipeline design");

  await expect(page.getByText("Only enrolled students can submit work")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit" })).toHaveCount(0);
});

test.describe("Late submissions are flagged for staff", () => {
  test.use({ storageState: STAFF_SESSION });

  test("the late submission made by the student shows as late", async ({ page }) => {
    await page.goto("/staff/assessments");
    await page.getByRole("link", { name: "Databases coursework" }).click();

    await expect(page.getByRole("table", { name: "Submissions" }).getByRole("row", { name: /Alma Tanjin/ })).toContainText("Late");
  });
});
