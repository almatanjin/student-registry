import { expect, test, type Locator, type Page } from "@playwright/test";
import { STAFF_SESSION } from "./support/accounts";

test.use({ storageState: STAFF_SESSION, viewport: { width: 1024, height: 800 } });

/** Every table on the page fits its box, so nothing hides behind a sideways scroll. */
async function expectNoTableOverflow(page: Page) {
  const tables = page.locator('[data-slot="table-container"]');
  await expect(tables.first()).toBeVisible();
  const overflows = await tables.evaluateAll((boxes) => boxes.map((box) => box.scrollWidth - box.clientWidth));
  expect(overflows.every((overflow) => overflow <= 0), `sideways overflow per table: ${overflows.join(", ")}`).toBe(true);
}

/** The element lies wholly inside its table's visible box. */
async function expectFullyShown(element: Locator) {
  await expect(element).toBeVisible();
  const inside = await element.evaluate((node) => {
    const box = node.closest('[data-slot="table-container"]')?.getBoundingClientRect();
    const rect = node.getBoundingClientRect();
    return Boolean(box) && rect.left >= (box?.left ?? 0) - 0.5 && rect.right <= (box?.right ?? 0) + 0.5;
  });
  expect(inside).toBe(true);
}

test.describe("Pages fit beside the sidebar", () => {
  test("Dashboard overdue table", async ({ page }) => {
    await page.goto("/staff/dashboard");

    await expectNoTableOverflow(page);
    await expectFullyShown(page.getByRole("columnheader", { name: "Unpaid since" }));
  });

  test("Staff fees page", async ({ page }) => {
    await page.goto("/staff/students");
    await page.getByRole("link", { name: "Priya Kabir" }).click();
    await page.getByRole("link", { name: "Fees and payments" }).click();

    await expectNoTableOverflow(page);
    const instalments = page.getByRole("table").filter({ hasText: "Still owed" });
    await expectFullyShown(instalments.getByText("Overdue", { exact: true }).first());
  });

  test("Module results table", async ({ page }) => {
    await page.goto("/staff/results");
    await page.getByRole("link", { name: /CS101/ }).click();
    await expect(page.getByRole("heading", { name: /CS101/ })).toBeVisible();

    await expectNoTableOverflow(page);
    await expectFullyShown(page.getByRole("columnheader", { name: "Actions" }));
    const table = page.getByRole("table", { name: "Module results" });
    for (const button of await table.getByRole("button", { name: /Withhold|Publish|Return to pending/ }).all()) {
      await expectFullyShown(button);
    }
  });

  test("Submitted file names", async ({ page }) => {
    await page.goto("/staff/assessments");
    await page.getByRole("link", { name: "Lab report 1", exact: true }).click();

    const names = page.locator('a[href^="/api/submissions/"] span').filter({ hasText: /\.pdf$|\.docx$/ });
    await expect(names.first()).toBeVisible();
    // Where a name wraps onto a new line, the character before the break must be a space or hyphen.
    const midWordBreaks = await names.evaluateAll((spans) =>
      spans.flatMap((span) => {
        const text = span.textContent ?? "";
        const node = span.firstChild;
        if (!node) return [];
        const tops = [...text].map((_, index) => {
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + 1);
          return Math.round(range.getBoundingClientRect().top);
        });
        return tops.flatMap((top, index) =>
          index > 0 && top > tops[index - 1] && !/[\s-]/.test(text[index - 1]) ? [`${text} at ${index}`] : [],
        );
      }),
    );
    expect(midWordBreaks).toEqual([]);
  });
});
