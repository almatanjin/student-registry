import { expect, test, type Page } from "@playwright/test";
import { STAFF_SESSION, STUDENT, seedPassword } from "./support/accounts";
import { expectOnSignInPage, signIn } from "./support/sign-in";
import { createStudentAsStaff } from "./support/students";

async function changePassword(page: Page, current: string, next: string, confirm = next) {
  await page.getByLabel("Current password").fill(current);
  await page.getByLabel("New password", { exact: true }).fill(next);
  await page.getByLabel("Confirm new password").fill(confirm);
  await page.getByRole("button", { name: "Change password" }).click();
}

/** A new student who has signed in and replaced the initial password, so their account is ready to use. */
async function readyStudent(browser: Parameters<typeof createStudentAsStaff>[0], page: Page, name: string) {
  const student = await createStudentAsStaff(browser, name);
  await signIn(page, student.email, student.initialPassword);
  await changePassword(page, student.initialPassword, "my-own-pass-1");
  await expect(page).toHaveURL(/\/student\/assessments$/);
  return { ...student, password: "my-own-pass-1" };
}

test.describe("Initial and reset passwords must be changed at the next sign-in", () => {
  test("First sign-in of a new student", async ({ browser, page }) => {
    const student = await createStudentAsStaff(browser, "Kofi Boateng");

    await signIn(page, student.email, student.initialPassword);

    await expect(page).toHaveURL(/\/change-password$/);
    await expect(page.getByText("Choose a new password before you continue")).toBeVisible();
  });

  test("Trying to skip the change", async ({ browser, page }) => {
    const student = await createStudentAsStaff(browser, "Lena Novak");
    await signIn(page, student.email, student.initialPassword);
    await expect(page).toHaveURL(/\/change-password$/);

    for (const path of ["/student/assessments", "/student/fees", "/", "/sign-in"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/change-password$/);
    }
  });

  test("After the change", async ({ browser, page }) => {
    const student = await createStudentAsStaff(browser, "Maya Lindqvist");
    await signIn(page, student.email, student.initialPassword);

    await changePassword(page, student.initialPassword, "maya-chosen-pass");

    await expect(page).toHaveURL(/\/student\/assessments$/);
    await expect(page.getByRole("heading", { name: "Assessments" })).toBeVisible();
    await page.goto("/student/fees");
    await expect(page).toHaveURL(/\/student\/fees$/);
  });

  test("Signing out instead", async ({ browser, page }) => {
    const student = await createStudentAsStaff(browser, "Omar Haddad");
    await signIn(page, student.email, student.initialPassword);

    await page.getByRole("button", { name: "Sign out" }).click();
    await expectOnSignInPage(page);

    await signIn(page, student.email, student.initialPassword);
    await expect(page).toHaveURL(/\/change-password$/);
  });

  test("Seeded demo accounts", async ({ page }) => {
    await signIn(page, STUDENT.email, seedPassword());

    await expect(page).toHaveURL(/\/student\/assessments$/);
  });
});

test.describe("Signed-in people change their own password", () => {
  test("Finding the change-password page", async ({ browser }) => {
    const staff = await browser.newContext({ storageState: STAFF_SESSION });
    const page = await staff.newPage();
    await page.goto("/staff/dashboard");

    await page.getByRole("link", { name: "Change password" }).click();

    await expect(page).toHaveURL(/\/change-password$/);
    await expect(page.getByRole("heading", { name: "Change password" })).toBeVisible();
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/staff\/dashboard$/);
    await staff.close();
  });

  test("Changing your password", async ({ browser, page }) => {
    const student = await readyStudent(browser, page, "Nia Mensah");
    await page.getByRole("link", { name: "Change password" }).click();

    await changePassword(page, student.password, "second-own-pass");

    await expect(page.getByText("Your password has been changed")).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expectOnSignInPage(page);
    await signIn(page, student.email, student.password);
    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await signIn(page, student.email, "second-own-pass");
    await expect(page).toHaveURL(/\/student\/assessments$/);
  });

  test("Wrong current password", async ({ browser, page }) => {
    const student = await readyStudent(browser, page, "Pedro Alves");
    await page.goto("/change-password");

    await changePassword(page, "not-my-password", "another-pass-1");

    await expect(page.getByLabel("Current password")).toHaveAccessibleDescription("Your current password is incorrect");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expectOnSignInPage(page);
    await signIn(page, student.email, student.password);
    await expect(page).toHaveURL(/\/student\/assessments$/);
  });

  test("Passwords do not match", async ({ browser, page }) => {
    const student = await createStudentAsStaff(browser, "Quinn Taylor");
    await signIn(page, student.email, student.initialPassword);

    await changePassword(page, student.initialPassword, "quinn-new-pass", "quinn-new-pas");

    await expect(page.getByLabel("Confirm new password")).toHaveAccessibleDescription("The passwords do not match");
    await expect(page).toHaveURL(/\/change-password$/);
  });

  test.describe("Changing a password ends other sessions", () => {
    test("Changing your password with another session open", async ({ browser, page }) => {
      const student = await readyStudent(browser, page, "Ravi Kumar");
      const other = await browser.newContext();
      const otherPage = await other.newPage();
      await signIn(otherPage, student.email, student.password);
      await expect(otherPage).toHaveURL(/\/student\/assessments$/);

      await page.getByRole("link", { name: "Change password" }).click();
      await changePassword(page, student.password, "ravi-newer-pass");
      await expect(page.getByText("Your password has been changed")).toBeVisible();

      await page.goto("/student/fees");
      await expect(page).toHaveURL(/\/student\/fees$/);
      await otherPage.goto("/student/fees");
      await expectOnSignInPage(otherPage);
      await other.close();
    });
  });
});

test.describe("Staff reset a student's password", () => {
  async function resetAsStaff(browser: Parameters<typeof createStudentAsStaff>[0], studentNumber: string, temporary: string) {
    const staff = await browser.newContext({ storageState: STAFF_SESSION });
    const page = await staff.newPage();
    await page.goto(`/staff/students/${studentNumber}`);
    await page.getByRole("button", { name: "Reset password" }).click();
    await page.getByLabel("Temporary password").fill(temporary);
    await page.getByRole("button", { name: "Set temporary password" }).click();
    await expect(
      page.getByText("Password reset. The student must choose a new password when they next sign in"),
    ).toBeVisible();
    await staff.close();
  }

  test("Resetting a forgotten password", async ({ browser, page }) => {
    const student = await readyStudent(browser, page, "Sara Ito");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expectOnSignInPage(page);

    await resetAsStaff(browser, student.studentNumber, "temporary-pass-9");

    await signIn(page, student.email, student.password);
    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await signIn(page, student.email, "temporary-pass-9");
    await expect(page).toHaveURL(/\/change-password$/);
    await expect(page.getByText("Choose a new password before you continue")).toBeVisible();
  });

  test("Temporary password too short", async ({ browser }) => {
    const student = await createStudentAsStaff(browser, "Tomas Ruiz");
    const staff = await browser.newContext({ storageState: STAFF_SESSION });
    const page = await staff.newPage();
    await page.goto(`/staff/students/${student.studentNumber}`);

    await page.getByRole("button", { name: "Reset password" }).click();
    await page.getByLabel("Temporary password").fill("short");
    await page.getByRole("button", { name: "Set temporary password" }).click();

    await expect(page.getByLabel("Temporary password")).toHaveAccessibleDescription("Use at least 8 characters");
    await staff.close();
  });

  test("Staff reset while the student is signed in", async ({ browser, page }) => {
    const student = await readyStudent(browser, page, "Uma Patel");

    await resetAsStaff(browser, student.studentNumber, "temporary-pass-8");

    await page.goto("/student/fees");
    await expectOnSignInPage(page);
  });
});
