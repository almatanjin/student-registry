import { expect, test, type Page } from "@playwright/test";
import { SEED_STUDENTS } from "../prisma/seed/students";
import { STAFF_SESSION, seedPassword } from "./support/accounts";
import { signInAs } from "./support/sign-in";

async function openFees(page: Page, name: string) {
  await page.goto(`/staff/students?q=${encodeURIComponent(name)}`);
  await page.getByRole("link", { name }).click();
  await page.getByRole("link", { name: "Fees and payments" }).click();
  await expect(page.getByRole("heading", { name: `Fees: ${name}` })).toBeVisible();
}

/** One of the summary boxes, such as "Outstanding". */
function summaryBox(page: Page, label: string) {
  return page.getByRole("main").getByRole("group", { name: label, exact: true });
}

test.describe("Staff record payments", () => {
  test.use({ storageState: STAFF_SESSION });

  test("Valid payment", async ({ page }) => {
    await openFees(page, "Priya Patel");
    await expect(summaryBox(page, "Outstanding")).toContainText("£9,000.00");

    await page.getByLabel("Amount").fill("250.00");
    await page.getByLabel("Reference number").fill("E2E-PRIYA-1");
    await page.getByRole("button", { name: "Record payment" }).click();

    await expect(page.getByText("Payment E2E-PRIYA-1 recorded.")).toBeVisible();
    await expect(summaryBox(page, "Outstanding")).toContainText("£8,750.00");
    await expect(summaryBox(page, "Paid")).toContainText("£250.00");
    const history = page.getByRole("table").filter({ hasText: "Reference" });
    await expect(history.getByRole("row", { name: /E2E-PRIYA-1/ })).toContainText("£250.00");
  });

  test("Duplicate reference number", async ({ page }) => {
    await openFees(page, "Priya Patel");

    await page.getByLabel("Amount").fill("1.00");
    await page.getByLabel("Reference number").fill("e2e-priya-1");
    await page.getByRole("button", { name: "Record payment" }).click();

    await expect(page.getByLabel("Reference number")).toHaveAccessibleDescription(
      "This reference number has already been recorded",
    );
  });

  test("Overpayment attempt", async ({ page }) => {
    await openFees(page, "Priya Patel");

    await page.getByLabel("Amount").fill("100000");
    await page.getByLabel("Reference number").fill("E2E-PRIYA-OVER");
    await page.getByRole("button", { name: "Record payment" }).click();

    await expect(page.getByLabel("Amount")).toHaveAccessibleDescription(
      "This payment is more than the outstanding balance of £8,750.00",
    );
  });

  test("Invalid amount or date", async ({ page }) => {
    await openFees(page, "Priya Patel");

    await page.getByLabel("Amount").fill("12.345");
    await page.getByLabel("Payment date").fill("2999-01-01");
    await page.getByRole("button", { name: "Record payment" }).click();

    await expect(page.getByLabel("Amount")).toHaveAccessibleDescription(/at most two decimal places/);
    await expect(page.getByLabel("Payment date")).toHaveAccessibleDescription("The payment date cannot be in the future");
    await expect(page.getByLabel("Reference number")).toHaveAccessibleDescription("Enter the reference number");
  });

  test("Instalment states", async ({ page }) => {
    await openFees(page, "Daniel Mensah");

    const instalments = page.getByRole("table").filter({ hasText: "Due date" });
    await expect(instalments.getByText("Paid", { exact: true })).toHaveCount(2);
    await expect(page.getByText("This student has paid in full.")).toBeVisible();
  });
});

test.describe("Overdue students are flagged on the Registry dashboard", () => {
  test.use({ storageState: STAFF_SESSION });

  test("Overdue student appears, and Paying clears the flag", async ({ page }) => {
    await page.goto("/staff/dashboard");
    const overdueList = page.getByRole("table", { name: "Overdue balances" });
    const sofia = overdueList.getByRole("row", { name: /Sofia Rossi/ });
    await expect(sofia).toContainText("£6,000.00");

    await sofia.getByRole("link", { name: "Sofia Rossi" }).click();
    await expect(page.getByRole("heading", { name: "Fees: Sofia Rossi" })).toBeVisible();
    await page.getByLabel("Amount").fill("6,000.00");
    await page.getByLabel("Reference number").fill("E2E-SOFIA-CLEAR");
    await page.getByRole("button", { name: "Record payment" }).click();
    await expect(page.getByText("Payment E2E-SOFIA-CLEAR recorded.")).toBeVisible();

    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Dashboard" }).click();
    await expect(overdueList).toBeVisible();
    await expect(overdueList.getByRole("row", { name: /Sofia Rossi/ })).toHaveCount(0);
  });

  test("Withdrawn student with overdue balance", async ({ page }) => {
    await page.goto("/staff/dashboard");

    const fatima = page.getByRole("table", { name: "Overdue balances" }).getByRole("row", { name: /Fatima Hassan/ });
    await expect(fatima).toContainText("Withdrawn");
    await expect(fatima).toContainText("£6,000.00");
  });
});

test.describe("Students view their own fees", () => {
  test("Student with an overdue balance", async ({ page }) => {
    const fatima = SEED_STUDENTS.find((student) => student.fullName === "Fatima Hassan");
    await signInAs(page, fatima?.email ?? "", seedPassword());
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Fees" }).click();

    await expect(page.getByRole("main").getByRole("alert")).toContainText("£6,000.00 is overdue");
    await expect(summaryBox(page, "Overdue")).toContainText("£6,000.00");
    const overdueRow = page.getByRole("table").filter({ hasText: "Due date" }).getByRole("row").filter({ hasText: "Overdue" });
    await expect(overdueRow.first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Record payment" })).toHaveCount(0);
  });

  test("Programme fee plan", async ({ browser }) => {
    const context = await browser.newContext({ storageState: STAFF_SESSION });
    const page = await context.newPage();
    await page.goto("/staff/programmes");

    const msc = page.getByRole("region", { name: "MSc Data Science fee plan" });
    await expect(msc.getByRole("row")).toHaveCount(3);
    await expect(msc).toContainText("1 October");
    await expect(msc).toContainText("£6,000.00");
    await context.close();
  });
});
