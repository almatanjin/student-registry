import { expect, test } from "@playwright/test";
import { STAFF_EMAIL, STAFF_SESSION, STUDENT_SESSION } from "./support/accounts";

test.describe("Sign-in page shows the brand", () => {
  test("Opening the sign-in page", async ({ page }) => {
    await page.goto("/sign-in");

    await expect(page.locator('img[src*="pen-mark"]')).toBeVisible();
    await expect(page.getByText("Student Registry", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });
});

test.describe("Each role sees its own sidebar", () => {
  test.describe("as staff", () => {
    test.use({ storageState: STAFF_SESSION });

    test("Staff sidebar", async ({ page }) => {
      await page.goto("/staff/dashboard");

      const sidebar = page.getByRole("complementary", { name: "Sidebar" });
      await expect(sidebar.getByText("Student Registry", { exact: true })).toBeVisible();
      await expect(sidebar.getByText("Staff", { exact: true })).toBeVisible();
      await expect(sidebar.getByRole("navigation", { name: "Main" }).getByRole("link")).toHaveText([
        "Dashboard",
        "Students",
        "Assessments",
        "Results",
        "Programmes",
      ]);
    });
  });

  test.describe("as a student", () => {
    test.use({ storageState: STUDENT_SESSION });

    test("Student sidebar", async ({ page }) => {
      await page.goto("/student/assessments");

      const sidebar = page.getByRole("complementary", { name: "Sidebar" });
      await expect(sidebar.getByText("Student", { exact: true })).toBeVisible();
      await expect(sidebar.getByRole("navigation", { name: "Main" }).getByRole("link")).toHaveText([
        "Assessments",
        "Marksheet",
        "Fees",
        "Profile",
      ]);
    });
  });
});

test.describe("Each role sees its own sidebar on the change-password page", () => {
  test.use({ storageState: STAFF_SESSION });

  test("Change password page", async ({ page }) => {
    await page.goto("/staff/dashboard");

    await page.getByRole("complementary", { name: "Sidebar" }).getByRole("link", { name: "Change password" }).click();

    await expect(page).toHaveURL(/\/change-password$/);
    await expect(page.getByRole("heading", { name: "Change password" })).toBeVisible();
    const sidebar = page.getByRole("complementary", { name: "Sidebar" });
    await expect(sidebar.getByRole("navigation", { name: "Main" }).getByRole("link")).toHaveCount(5);
    await sidebar.getByRole("link", { name: "Students" }).click();
    await expect(page).toHaveURL(/\/staff\/students$/);
  });
});

test.describe("The current page is marked", () => {
  test.use({ storageState: STAFF_SESSION });

  test("Page inside a section", async ({ page }) => {
    await page.goto("/staff/students");
    await page.getByRole("link", { name: "Alma Tanjin" }).click();
    await page.getByRole("link", { name: "Fees and payments" }).click();
    await expect(page).toHaveURL(/\/fees$/);

    const current = page.getByRole("navigation", { name: "Main" }).locator('[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText("Students");
  });
});

test.describe("Account actions sit in the sidebar footer", () => {
  test.use({ storageState: STAFF_SESSION });

  test("Signed-in footer", async ({ page }) => {
    await page.goto("/staff/dashboard");

    const sidebar = page.getByRole("complementary", { name: "Sidebar" });
    await expect(sidebar.getByText(STAFF_EMAIL)).toBeVisible();
    await expect(sidebar.getByText("Signed in as staff")).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Change password" })).toBeVisible();
    await expect(sidebar.getByRole("button", { name: "Sign out" })).toBeVisible();
  });
});

test.describe("Phones use a menu", () => {
  test.use({ storageState: STAFF_SESSION, viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/staff/dashboard");
    await expect(page.getByRole("complementary", { name: "Sidebar" })).toBeHidden();
  });

  test("Opening the menu", async ({ page }) => {
    await page.getByRole("button", { name: "Menu" }).click();

    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("navigation", { name: "Main" }).getByRole("link")).toHaveText([
      "Dashboard",
      "Students",
      "Assessments",
      "Results",
      "Programmes",
    ]);
    await expect(menu.getByText("Signed in as staff")).toBeVisible();
    await expect(menu.getByRole("link", { name: "Change password" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Sign out" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Close menu" })).toBeVisible();
  });

  test("Choosing a page closes the menu", async ({ page }) => {
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Students" }).click();

    await expect(page).toHaveURL(/\/staff\/students$/);
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
    await expect(page.getByRole("heading", { name: "Students" })).toBeVisible();
  });

  test("Closing without choosing", async ({ page }) => {
    await page.getByRole("button", { name: "Menu" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();

    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("button", { name: "Close menu" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeHidden();
    await expect(page).toHaveURL(/\/staff\/dashboard$/);
  });
});
