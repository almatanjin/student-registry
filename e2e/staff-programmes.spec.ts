import { expect, test, type Locator, type Page } from "@playwright/test";
import { STAFF_SESSION } from "./support/accounts";

test.use({ storageState: STAFF_SESSION });

function programmeCard(page: Page, name: string) {
  return page.getByRole("article", { name });
}

/** The colour a setting in theme.css resolves to, in the same format the browser reports for an element. */
async function themeColour(page: Page, variable: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.backgroundColor = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, variable);
}

function background(locator: Locator) {
  return locator.evaluate((element) => getComputedStyle(element).backgroundColor);
}

test.describe("Programmes page shows each programme at a glance", () => {
  test("Programme card heading", async ({ page }) => {
    await page.goto("/staff/programmes");

    const bsc = programmeCard(page, "BSc (Hons) Computer Science");
    await expect(bsc.getByRole("heading", { name: "BSc (Hons) Computer Science" })).toBeVisible();
    await expect(bsc.getByText("Annual fee", { exact: true })).toBeVisible();
    await expect(bsc.getByText("£9,000.00", { exact: true }).first()).toBeVisible();
    expect(await background(bsc.getByText("BSC-CS", { exact: true }))).toBe(
      await themeColour(page, "--app-card-yellow-badge"),
    );

    const msc = programmeCard(page, "MSc Data Science");
    await expect(msc.getByText("£12,000.00", { exact: true }).first()).toBeVisible();
    expect(await background(msc.getByText("MSC-DS", { exact: true }))).toBe(
      await themeColour(page, "--app-card-purple-badge"),
    );
  });
});

test.describe("Fee plan shows its instalment count and total", () => {
  test("Fee plan total", async ({ page }) => {
    await page.goto("/staff/programmes");

    const plan = page.getByRole("region", { name: "MSc Data Science fee plan" });
    await expect(plan.getByRole("heading", { name: "Fee plan · 2 instalments" })).toBeVisible();
    await expect(plan.getByRole("columnheader", { name: "Instalment" })).toBeVisible();
    await expect(plan.getByRole("row", { name: /1 October/ })).toContainText("£6,000.00");
    await expect(plan.getByRole("row", { name: /1 February/ })).toContainText("£6,000.00");
    const rows = plan.getByRole("row");
    await expect(rows.last()).toHaveText(/^Total\s*£12,000.00$/);
  });
});

test.describe("Modules show as alternating pills", () => {
  test("Module pills", async ({ page }) => {
    await page.goto("/staff/programmes");

    const modules = page
      .getByRole("region", { name: "BSc (Hons) Computer Science modules" })
      .getByRole("listitem");
    await expect(modules).toHaveText([/CS101\s*Programming Fundamentals/, /CS102\s*Databases/]);
    const pill = (index: number) => modules.nth(index).locator("[data-slot=module-pill]");
    expect(await background(pill(0))).toBe(await themeColour(page, "--app-tone-blue"));
    expect(await background(pill(1))).toBe(await themeColour(page, "--app-tone-green"));
  });
});

test.describe("Programmes page fits every screen", () => {
  test("Wide screen", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/staff/programmes");

    const bsc = await programmeCard(page, "BSc (Hons) Computer Science").boundingBox();
    const msc = await programmeCard(page, "MSc Data Science").boundingBox();
    expect(bsc?.y).toBe(msc?.y);
    expect((msc?.x ?? 0) - ((bsc?.x ?? 0) + (bsc?.width ?? 0))).toBeGreaterThanOrEqual(32);
  });

  test("Phone", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/staff/programmes");

    const bsc = await programmeCard(page, "BSc (Hons) Computer Science").boundingBox();
    const msc = await programmeCard(page, "MSc Data Science").boundingBox();
    expect(msc?.y ?? 0).toBeGreaterThan((bsc?.y ?? 0) + (bsc?.height ?? 0));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
  });
});
