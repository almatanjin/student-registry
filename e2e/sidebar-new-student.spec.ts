import { expect, test } from "@playwright/test";
import { signIn } from "./support/sign-in";
import { createStudentAsStaff } from "./support/students";

test.describe("Account actions sit in the sidebar footer", () => {
  test("Long email", async ({ browser, page }) => {
    const student = await createStudentAsStaff(browser, "Maximiliana Wolfeschlegelsteinhausen Bergerdorff");
    expect(student.email.length).toBeGreaterThan(60);
    await signIn(page, student.email, student.initialPassword);
    await page.getByLabel("Current password").fill(student.initialPassword);
    await page.getByLabel("New password", { exact: true }).fill("a-new-password-1");
    await page.getByLabel("Confirm new password").fill("a-new-password-1");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page).toHaveURL(/\/student\/assessments$/);

    const sidebar = page.getByRole("complementary", { name: "Sidebar" });
    const email = sidebar.getByTitle(student.email);
    await expect(email).toHaveText(student.email);
    const { scrollWidth, clientWidth } = await email.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(scrollWidth).toBeGreaterThan(clientWidth);
    expect((await sidebar.boundingBox())?.width).toBe(240);
  });
});

test.describe("Each role sees its own sidebar", () => {
  test("Forced change has no sidebar", async ({ browser, page }) => {
    const student = await createStudentAsStaff(browser, "Ines Duarte");
    await signIn(page, student.email, student.initialPassword);

    await expect(page).toHaveURL(/\/change-password$/);
    await expect(page.getByLabel("Current password")).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Sidebar" })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  });
});
