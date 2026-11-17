import { expect, test, type Page } from "@playwright/test";
import { STAFF_SESSION } from "./support/accounts";

test.use({ storageState: STAFF_SESSION });

const STUDENT_ID = /^SMS-\d{4}-\d{4}$/;

function studentRows(page: Page) {
  return page.getByRole("table").getByRole("row").filter({ hasNot: page.getByRole("columnheader") });
}

/** Opens a seeded student's record from the list and returns their Student ID as shown in the row. */
async function openFromList(page: Page, name: string) {
  await page.goto(`/staff/students?q=${encodeURIComponent(name)}`);
  const row = studentRows(page).filter({ hasText: name });
  const studentId = (await row.getByText(STUDENT_ID).first().textContent()) ?? "";
  await row.getByRole("link", { name }).click();
  return studentId;
}

test.describe("Student pages are addressed by Student ID", () => {
  test("Opening a student from the list", async ({ page }) => {
    const studentId = await openFromList(page, "Sofia Rossi");

    expect(studentId).toMatch(STUDENT_ID);
    await expect(page).toHaveURL(new RegExp(`/staff/students/${studentId}$`));
    await expect(page.getByRole("heading", { name: "Sofia Rossi" })).toBeVisible();
  });

  test("Opening fees and edit from the record", async ({ page }) => {
    const studentId = await openFromList(page, "Sofia Rossi");

    await page.getByRole("link", { name: "Fees and payments" }).click();
    await expect(page).toHaveURL(new RegExp(`/staff/students/${studentId}/fees$`));
    await expect(page.getByRole("heading", { name: "Fees: Sofia Rossi" })).toBeVisible();

    await page.getByRole("link", { name: "Sofia Rossi" }).click();
    await expect(page).toHaveURL(new RegExp(`/staff/students/${studentId}$`));

    await page.getByRole("link", { name: "Edit" }).click();
    await expect(page).toHaveURL(new RegExp(`/staff/students/${studentId}/edit$`));
    await expect(page.getByRole("heading", { name: "Edit Sofia Rossi" })).toBeVisible();
  });

  test("Opening fees from the overdue list", async ({ page }) => {
    await page.goto("/staff/dashboard");
    const row = page.getByRole("table", { name: "Overdue balances" }).getByRole("row").nth(1);
    const studentId = (await row.getByText(STUDENT_ID).first().textContent()) ?? "";
    const name = (await row.getByRole("link").textContent()) ?? "";

    await row.getByRole("link").click();

    expect(studentId).toMatch(STUDENT_ID);
    await expect(page).toHaveURL(new RegExp(`/staff/students/${studentId}/fees$`));
    await expect(page.getByRole("heading", { name: `Fees: ${name}` })).toBeVisible();
  });

  test("After creating or editing a student", async ({ page }) => {
    await page.goto("/staff/students/new");
    await page.getByLabel("Full name").fill("Kofi Mensah");
    await page.getByLabel("Email").fill(`kofi.mensah.${Date.now()}@students.sms.example`);
    await page.getByLabel("Date of birth").fill("2006-02-11");
    await page.getByLabel("Programme").selectOption({ label: "MSc Data Science" });
    await page.getByLabel("Initial password").fill("kofi-first-login");
    await page.getByRole("button", { name: "Create student" }).click();

    await expect(page.getByRole("heading", { name: "Kofi Mensah" })).toBeVisible();
    const studentId = (await page.getByRole("main").getByText(STUDENT_ID).first().textContent()) ?? "";
    await expect(page).toHaveURL(new RegExp(`/staff/students/${studentId}$`));

    await page.getByRole("link", { name: "Edit" }).click();
    await page.getByLabel("Full name").fill("Kofi A. Mensah");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByRole("heading", { name: "Kofi A. Mensah" })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/staff/students/${studentId}$`));
  });

  test("Typing a Student ID into the address bar", async ({ page }) => {
    await page.goto("/staff/students?q=Sofia%20Rossi");
    const studentId = (await studentRows(page).getByText(STUDENT_ID).first().textContent()) ?? "";

    await page.goto(`/staff/students/${studentId}`);

    await expect(page.getByRole("heading", { name: "Sofia Rossi" })).toBeVisible();
    await expect(page.getByRole("main").getByText(studentId).first()).toBeVisible();
  });

  test("Unknown Student ID or internal id", async ({ page }) => {
    const unknown = await page.goto("/staff/students/SMS-1900-9999");
    expect(unknown?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();

    const listed = await page.request.get("/api/students?q=Sofia%20Rossi");
    const { students } = (await listed.json()) as { students: { id: string }[] };
    expect(students).toHaveLength(1);

    for (const path of ["", "/fees", "/edit"]) {
      const response = await page.goto(`/staff/students/${students[0].id}${path}`);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    }
  });
});
