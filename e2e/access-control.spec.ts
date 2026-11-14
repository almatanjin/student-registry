import { expect, test } from "@playwright/test";
import { STAFF_EMAIL, STAFF_SESSION, seedPassword } from "./support/accounts";
import { expectOnSignInPage, signIn } from "./support/sign-in";

test.describe("Sign in with email and password", () => {
  test("Valid credentials", async ({ page }) => {
    await signIn(page, STAFF_EMAIL, seedPassword());

    await expect(page).toHaveURL(/\/staff\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Registry dashboard" })).toBeVisible();
  });

  test("Wrong password or unknown email", async ({ page }) => {
    await signIn(page, STAFF_EMAIL, "definitely-not-the-password");

    await expectOnSignInPage(page);
    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveValue(STAFF_EMAIL);

    await signIn(page, "nobody@sms.example", seedPassword());
    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });

  test("Email in different letter case", async ({ page }) => {
    await signIn(page, STAFF_EMAIL.toUpperCase(), seedPassword());

    await expect(page).toHaveURL(/\/staff\/dashboard$/);
  });
});

test("Signing out", async ({ page }) => {
  await signIn(page, STAFF_EMAIL, seedPassword());
  await expect(page).toHaveURL(/\/staff\/dashboard$/);

  await page.getByRole("button", { name: "Sign out" }).click();

  await expectOnSignInPage(page);
  await page.goto("/staff/dashboard");
  await expectOnSignInPage(page);
});

test.describe("Signed-out visitors cannot reach the application", () => {
  test("Visiting a page while signed out", async ({ page }) => {
    for (const path of ["/", "/staff/dashboard", "/staff/students", "/student/assessments"]) {
      await page.goto(path);
      await expectOnSignInPage(page);
    }
  });

  test("Calling an API route while signed out", async ({ request }) => {
    const response = await request.get("/api/students");

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: { code: "unauthorized", message: "Sign in to continue." } });
  });
});

test.describe("staff navigation", () => {
  test.use({ storageState: STAFF_SESSION });

  test("a saved staff session starts on the Dashboard without signing in again", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/staff\/dashboard$/);
  });

  test("Staff see only the staff navigation", async ({ page }) => {
    await page.goto("/staff/dashboard");
    const nav = page.getByRole("navigation", { name: "Main" });

    for (const label of ["Dashboard", "Students", "Assessments", "Results", "Programmes"]) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
    await expect(nav.getByRole("link", { name: "Marksheet" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Fees" })).toHaveCount(0);
    await expect(nav.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
  });

  test("Staff opening a student page go to their own home page", async ({ page }) => {
    await page.goto("/student/assessments");

    await expect(page).toHaveURL(/\/staff\/dashboard$/);
  });
});

test.describe("missing records", () => {
  test.use({ storageState: STAFF_SESSION });

  test("an unknown record shows the not-found page with a way back", async ({ page }) => {
    const response = await page.goto("/staff/students/does-not-exist");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await page.getByRole("link", { name: "Back to the registry" }).click();
    await expect(page).toHaveURL(/\/staff\/dashboard$/);
  });
});
