import { expect, test, type Page } from "@playwright/test";
import { STAFF_SESSION } from "./support/accounts";

test.use({ storageState: STAFF_SESSION });

const STATUSES = ["Enrolled", "Deferred", "Withdrawn", "Completed"] as const;

function tile(page: Page, label: string) {
  return page.getByRole("region", { name: label });
}

async function tileValue(page: Page, label: string) {
  return tile(page, label).locator('[data-slot="stat-value"]').innerText();
}

/** How many students the student list shows for a status filter. */
async function studentsWithStatus(page: Page, status: string) {
  await page.goto(`/staff/students?status=${status.toUpperCase()}`);
  const empty = page.getByText("No students match these filters");
  const rows = page.getByRole("table").getByRole("row").filter({ hasNot: page.getByRole("columnheader") });
  await expect(empty.or(rows.first())).toBeVisible();
  return (await empty.isVisible()) ? 0 : rows.count();
}

/** Complete, still-Pending results across every module, read from the Results pages. */
async function resultsReadyToPublish(page: Page) {
  await page.goto("/staff/results");
  const hrefs = await page.getByRole("list", { name: "Modules" }).getByRole("link").evaluateAll((links) =>
    links.map((link) => link.getAttribute("href") as string),
  );
  let total = 0;
  for (const href of hrefs) {
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const table = page.getByRole("table", { name: "Module results" });
    if ((await table.count()) === 0) continue;
    total += await table
      .getByRole("row")
      .filter({ has: page.locator("span.rounded-full", { hasText: /^Pending$/ }) })
      .filter({ has: page.getByRole("button", { name: "Publish", exact: true, disabled: false }) })
      .count();
  }
  return total;
}

test.describe("Registry dashboard cards", () => {
  test("the four cards show the current figures", async ({ page }) => {
    const counts: Record<string, number> = {};
    for (const status of STATUSES) counts[status] = await studentsWithStatus(page, status);
    const ready = await resultsReadyToPublish(page);

    await page.goto("/staff/dashboard");

    expect(await tileValue(page, "Enrolled students")).toBe(String(counts.Enrolled));
    const others = STATUSES.slice(1)
      .filter((status) => counts[status] > 0)
      .map((status) => `${counts[status]} ${status.toLowerCase()}`)
      .join(", ");
    await expect(tile(page, "Enrolled students")).toContainText(others);

    const overdueRows = await page
      .getByRole("table", { name: "Overdue balances" })
      .getByRole("row")
      .filter({ hasNot: page.getByRole("columnheader") })
      .count();
    expect(await tileValue(page, "Overdue balances")).toBe(String(overdueRows));

    expect(await tileValue(page, "Fees collected")).toMatch(/^(\d|[1-9]\d|100)%$/);
    await expect(tile(page, "Fees collected")).toContainText(/£[\d,]+\.\d{2} of £[\d,]+\.\d{2} billed/);

    expect(await tileValue(page, "Results to publish")).toBe(String(ready));
  });

  test("Opening the enrolled list", async ({ page }) => {
    await page.goto("/staff/dashboard");

    await tile(page, "Enrolled students").getByRole("link").click();

    await expect(page).toHaveURL(/\/staff\/students\?status=ENROLLED$/);
    await expect(page.getByLabel("Status")).toHaveValue("ENROLLED");
  });

  test("the Overdue balances card jumps to the overdue list", async ({ page }) => {
    await page.goto("/staff/dashboard");

    await tile(page, "Overdue balances").getByRole("link").click();

    await expect(page).toHaveURL(/\/staff\/dashboard#overdue-balances$/);
    await expect(page.locator("#overdue-balances")).toBeInViewport();
  });

  test("the Results to publish card opens the results page", async ({ page }) => {
    await page.goto("/staff/dashboard");

    await tile(page, "Results to publish").getByRole("link").click();

    await expect(page).toHaveURL(/\/staff\/results$/);
  });
});
