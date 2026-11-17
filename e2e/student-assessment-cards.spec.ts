import { expect, test, type Page } from "@playwright/test";
import { STAFF_SESSION } from "./support/accounts";
import { signIn } from "./support/sign-in";
import { createStudentAsStaff } from "./support/students";

// A new BSc student who has submitted nothing, so the cards do not depend on what earlier tests submitted.
const CARD_STUDENT_SESSION = "e2e/.auth/card-student.json";

test.beforeAll(async ({ browser }) => {
  const student = await createStudentAsStaff(browser, "Kiran Card");
  // An explicit empty session, since this file's storageState default does not exist yet.
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await signIn(page, student.email, student.initialPassword);
  await page.getByLabel("Current password").fill(student.initialPassword);
  await page.getByLabel("New password", { exact: true }).fill("card-student-pass-1");
  await page.getByLabel("Confirm new password").fill("card-student-pass-1");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page).toHaveURL(/\/student\/assessments$/);
  await context.storageState({ path: CARD_STUDENT_SESSION });
  await context.close();
});

test.use({ storageState: CARD_STUDENT_SESSION });

function assessmentList(page: Page) {
  return page.getByRole("list", { name: "Your assessments" });
}

function card(page: Page, title: string) {
  return assessmentList(page).getByRole("link", { name: new RegExp(title) });
}

/** The colour a card setting in theme.css resolves to, in the same format the browser reports for a card. */
async function cardColour(page: Page, name: string) {
  return page.evaluate((colour) => {
    const probe = document.createElement("span");
    probe.style.backgroundColor = `var(--app-card-${colour})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, name);
}

/** The colour a pill tone in theme.css resolves to. */
async function toneColour(page: Page, tone: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.backgroundColor = `var(--app-tone-${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, tone);
}

async function notSubmittedColour(scope: ReturnType<Page["locator"]>) {
  const pill = scope.getByText("Not submitted", { exact: true });
  await expect(pill).toBeVisible();
  return pill.evaluate((element) => getComputedStyle(element).backgroundColor);
}

test.describe("Missed deadline stands out", () => {
  test("Deadline passed without a submission", async ({ page }) => {
    await page.goto("/student/assessments");
    expect(await notSubmittedColour(card(page, "Databases coursework"))).toBe(await toneColour(page, "red"));

    // The assessment's own page keeps the grey pill.
    await card(page, "Databases coursework").click();
    await expect(page.getByRole("heading", { level: 1, name: "Databases coursework" })).toBeVisible();
    const yourSubmission = page.getByRole("region", { name: "Your submission", exact: true });
    expect(await notSubmittedColour(yourSubmission)).toBe(await toneColour(page, "neutral"));
  });

  test("Deadline still ahead", async ({ page }) => {
    await page.goto("/student/assessments");
    expect(await notSubmittedColour(card(page, "Normalisation exercise"))).toBe(await toneColour(page, "neutral"));
  });
});

test.describe("Each card has one light colour", () => {
  test("Six assessments", async ({ page, browser }) => {
    // The seeded BSc student has five assessments; add a sixth so the colours wrap round.
    const staff = await browser.newContext({ storageState: STAFF_SESSION });
    const staffPage = await staff.newPage();
    await staffPage.goto("/staff/assessments/new");
    await staffPage.getByLabel("Title").fill("E2E card colour check");
    await staffPage.getByLabel("Module").selectOption({ label: "CS102 Databases" });
    const deadline = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await staffPage.getByLabel("Submission deadline").fill(`${deadline}T17:00`);
    await staffPage.getByRole("button", { name: "Create assessment" }).click();
    await expect(staffPage.getByRole("heading", { name: "E2E card colour check" })).toBeVisible();
    await staff.close();

    await page.goto("/student/assessments");
    const cards = assessmentList(page).getByRole("link");
    expect(await cards.count()).toBeGreaterThanOrEqual(6);

    const order = ["yellow", "purple", "sky", "blue", "green"];
    const backgrounds = await cards.evaluateAll((links) => links.map((link) => getComputedStyle(link).backgroundColor));
    for (const [position, background] of backgrounds.entries()) {
      const colour = order[position % order.length];
      expect(background, `card ${position + 1} should be ${colour}`).toBe(await cardColour(page, colour));
    }
  });
});

/** The top-left corner of every card, in list order. */
async function cardCorners(page: Page) {
  const cards = assessmentList(page).getByRole("link");
  await expect(cards.first()).toBeVisible();
  return cards.evaluateAll((links) =>
    links.map((link) => {
      const box = link.getBoundingClientRect();
      return { x: Math.round(box.left), y: Math.round(box.top) };
    }),
  );
}

test.describe("Student assessments show as cards in a grid", () => {
  test("Wide screen", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/student/assessments");

    const [first, second, third, fourth] = await cardCorners(page);
    expect([second.y, third.y]).toEqual([first.y, first.y]);
    expect(first.x).toBeLessThan(second.x);
    expect(second.x).toBeLessThan(third.x);
    expect(fourth.y).toBeGreaterThan(first.y);
    expect(fourth.x).toBe(first.x);
  });

  test("Phone", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/student/assessments");

    const corners = await cardCorners(page);
    for (const [index, corner] of corners.entries()) {
      expect(corner.x).toBe(corners[0].x);
      if (index > 0) expect(corner.y).toBeGreaterThan(corners[index - 1].y);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
  });
});

test.describe("Decorative doodles", () => {
  test("Screen reader", async ({ page }) => {
    await page.goto("/student/assessments");

    await expect(card(page, "Normalisation exercise")).toHaveAccessibleName(
      /^CS102 Normalisation exercise Databases \d{1,2} Nov \d{4}, 17:00 · In 10 days Not submitted Open View$/,
    );
    // Every card has a doodle, and none of them is exposed as an image.
    await expect(assessmentList(page).locator("svg[aria-hidden='true']")).not.toHaveCount(0);
    await expect(assessmentList(page).getByRole("img")).toHaveCount(0);
  });
});

test.describe("Card contents", () => {
  test("Open assessment not yet submitted", async ({ page }) => {
    await page.goto("/student/assessments");

    const normalisation = card(page, "Normalisation exercise");
    for (const text of ["CS102", "Normalisation exercise", "Databases", "In 10 days", "Not submitted", "Open", "View"]) {
      await expect(normalisation).toContainText(text);
    }
  });

  test("Opening an assessment", async ({ page }) => {
    await page.goto("/student/assessments");
    await card(page, "Normalisation exercise").getByText("View").click();

    await expect(page).toHaveURL(/\/student\/assessments\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1, name: "Normalisation exercise" })).toBeVisible();
  });
});
