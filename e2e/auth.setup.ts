import { expect, test as setup } from "@playwright/test";
import { STAFF_EMAIL, STAFF_SESSION, STUDENT, STUDENT_SESSION, seedPassword } from "./support/accounts";
import { signIn } from "./support/sign-in";

setup("sign in as staff once and save the session", async ({ page }) => {
  await signIn(page, STAFF_EMAIL, seedPassword());
  await expect(page).toHaveURL(/\/staff\/dashboard$/);
  await page.context().storageState({ path: STAFF_SESSION });
});

setup("sign in as a student once and save the session", async ({ page }) => {
  await signIn(page, STUDENT.email, seedPassword());
  await expect(page).toHaveURL(/\/student\/assessments$/);
  await page.context().storageState({ path: STUDENT_SESSION });
});
