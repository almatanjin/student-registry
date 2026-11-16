import { expect, type Browser } from "@playwright/test";
import { STAFF_SESSION } from "./accounts";

let created = 0;

/**
 * Creates a student through the staff "Add student" form, the way the Registry team does,
 * and returns the new account's email and initial password.
 */
export async function createStudentAsStaff(browser: Browser, name: string) {
  created += 1;
  const slug = name.toLowerCase().replace(/[^a-z]+/g, ".");
  const email = `${slug}.${Date.now()}.${created}@students.sms.example`;
  const initialPassword = "initial-pass-123";

  const context = await browser.newContext({ storageState: STAFF_SESSION });
  const page = await context.newPage();
  await page.goto("/staff/students/new");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Date of birth").fill("2006-03-09");
  await page.getByLabel("Programme").selectOption({ label: "BSc (Hons) Computer Science" });
  await page.getByLabel("Initial password").fill(initialPassword);
  await page.getByRole("button", { name: "Create student" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  const url = page.url();
  await context.close();

  return { email, initialPassword, studentId: url.split("/").pop() as string };
}
