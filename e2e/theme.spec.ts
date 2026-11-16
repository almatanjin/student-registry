import { expect, test, type Page } from "@playwright/test";
import { STAFF_SESSION } from "./support/accounts";

test.use({ storageState: STAFF_SESSION });

/** The background colour of the first visible status pill on the page with exactly this label. */
async function pillColour(page: Page, label: string) {
  const pill = page.locator("span.rounded-full:visible", { hasText: new RegExp(`^${label}$`) }).first();
  await expect(pill).toBeVisible();
  return pill.evaluate((element) => getComputedStyle(element).backgroundColor);
}

/** The colour a tone setting in theme.css resolves to, in the same format the browser reports for a pill. */
async function toneColour(page: Page, tone: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.backgroundColor = `var(--app-tone-${name})`;
    document.body.append(probe);
    const colour = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return colour;
  }, tone);
}

test("status pills use the tone for their meaning", async ({ page }) => {
  const seen: Record<string, string> = {};

  await page.goto("/staff/students");
  seen.Enrolled = await pillColour(page, "Enrolled");
  seen.Completed = await pillColour(page, "Completed");

  await page.goto("/staff/assessments");
  await page.getByRole("link", { name: "Lab report 1", exact: true }).click();
  seen.Late = await pillColour(page, "Late");
  seen["On time"] = await pillColour(page, "On time");
  seen["Not submitted"] = await pillColour(page, "Not submitted");

  await page.getByRole("link", { name: "Manage CS101 results" }).click();
  seen.Fail = await pillColour(page, "Fail");
  seen.Pending = await pillColour(page, "Pending");

  await page.goto("/staff/students");
  await page.getByRole("link", { name: "Fatima Hassan" }).click();
  await page.getByRole("link", { name: "Fees and payments" }).click();
  seen.Overdue = await pillColour(page, "Overdue");
  seen.Paid = await pillColour(page, "Paid");

  const expected: Record<string, string> = {
    Enrolled: "green",
    "On time": "green",
    Paid: "green",
    Late: "yellow",
    Overdue: "red",
    Fail: "red",
    Completed: "blue",
    Pending: "sky",
    "Not submitted": "neutral",
  };
  for (const [label, tone] of Object.entries(expected)) {
    expect(seen[label], `${label} should use the ${tone} tone`).toBe(await toneColour(page, tone));
  }
});
