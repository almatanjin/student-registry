import path from "node:path";
import { expect, test } from "@playwright/test";
import { STAFF_SESSION } from "./support/accounts";
import { signIn } from "./support/sign-in";

const FIXTURES = path.join(import.meta.dirname, "..", "tests", "fixtures");

function inDays(days: number) {
  return `${new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}T17:00`;
}

/**
 * The whole Registry flow across both roles: staff enrol a student, see the fee billed, record a payment,
 * set an assessment; the student submits; staff grade and publish; the student sees the released result.
 */
test("a student's journey from enrolment to a released result", async ({ browser }) => {
  test.setTimeout(90_000);
  const staffContext = await browser.newContext({ storageState: STAFF_SESSION });
  const staff = await staffContext.newPage();

  // Staff enrol a new MSc student.
  await staff.goto("/staff/students/new");
  await staff.getByLabel("Full name").fill("Journey Student");
  await staff.getByLabel("Email").fill("journey.student@students.sms.example");
  await staff.getByLabel("Date of birth").fill("2003-03-03");
  await staff.getByLabel("Programme").selectOption({ label: "MSc Data Science" });
  await staff.getByLabel("Initial password").fill("journey-pass-123");
  await staff.getByRole("button", { name: "Create student" }).click();
  await expect(staff.getByRole("heading", { name: "Journey Student" })).toBeVisible();

  // The programme fee is billed straight away.
  await staff.getByRole("link", { name: "Fees and payments" }).click();
  await expect(staff.getByRole("group", { name: "Total fee" })).toContainText("£12,000.00");

  // Staff record a payment and the balance updates.
  await staff.getByLabel("Amount").fill("6,000.00");
  await staff.getByLabel("Reference number").fill("JOURNEY-PAY-1");
  await staff.getByRole("button", { name: "Record payment" }).click();
  await expect(staff.getByRole("group", { name: "Outstanding" })).toContainText("£6,000.00");

  // Staff set an assessment for a DS502 module.
  await staff.goto("/staff/assessments/new");
  await staff.getByLabel("Title").fill("Journey capstone");
  await staff.getByLabel("Module").selectOption({ label: "DS502 Data Engineering" });
  await staff.getByLabel("Submission deadline").fill(inDays(3));
  await staff.getByRole("button", { name: "Create assessment" }).click();
  await expect(staff.getByRole("heading", { name: "Journey capstone" })).toBeVisible();
  const assessmentUrl = staff.url();

  // The student signs in, replaces the initial password, submits on time, and sees nothing released yet.
  const studentContext = await browser.newContext();
  const student = await studentContext.newPage();
  await signIn(student, "journey.student@students.sms.example", "journey-pass-123");
  await expect(student).toHaveURL(/\/change-password$/);
  await student.getByLabel("Current password").fill("journey-pass-123");
  await student.getByLabel("New password", { exact: true }).fill("journey-own-pass");
  await student.getByLabel("Confirm new password").fill("journey-own-pass");
  await student.getByRole("button", { name: "Change password" }).click();
  await expect(student).toHaveURL(/\/student\/assessments$/);
  await student.getByRole("list", { name: "Your assessments" }).getByRole("link", { name: /Journey capstone/ }).click();
  await student.getByLabel("Your file").setInputFiles(path.join(FIXTURES, "sample.pdf"));
  await student.getByRole("button", { name: "Submit" }).click();
  await expect(student.getByText("sample.pdf was submitted.")).toBeVisible();
  await student.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Marksheet" }).click();
  await expect(student.getByRole("region", { name: /^DS502 / })).toContainText("Results not yet released");

  // Staff see the on-time submission and grade it.
  await staff.goto(assessmentUrl);
  const row = staff.getByRole("table", { name: "Submissions" }).getByRole("row", { name: /Journey Student/ });
  await expect(row).toContainText("On time");
  await staff.getByLabel("Grade for Journey Student").fill("74");
  await row.getByRole("button", { name: "Save" }).click();
  await expect(row).toContainText("Distinction");

  // Every DS502 assessment needs a grade before the module can be published, so staff grade the other one too.
  await staff.goto("/staff/assessments");
  await staff.getByRole("link", { name: "Pipeline design", exact: true }).click();
  const other = staff.getByRole("table", { name: "Submissions" }).getByRole("row", { name: /Journey Student/ });
  await staff.getByLabel("Grade for Journey Student").fill("58");
  await other.getByRole("button", { name: "Save" }).click();
  await expect(other).toContainText("Pass");

  // Staff publish the module result.
  await staff.getByRole("link", { name: "Manage DS502 results" }).click();
  await staff.getByRole("group", { name: "Result actions for Journey Student" }).getByRole("button", { name: "Publish" }).click();
  await expect(
    staff.getByRole("table", { name: "Module results" }).getByRole("row", { name: /Journey Student/ }),
  ).toContainText("Published");

  // The student now sees the released result.
  await student.reload();
  const released = student.getByRole("region", { name: /^DS502 / }).getByRole("row", { name: /Journey capstone/ });
  await expect(released).toContainText("74");
  await expect(released).toContainText("Distinction");
  await expect(student.getByRole("region", { name: /^DS502 / }).getByRole("row", { name: /Pipeline design/ })).toContainText("58");

  await staffContext.close();
  await studentContext.close();
});
