import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { waitForLayout } from "./ready";

const DEMO_STEP = "Read invoice.pdf";
const EVIDENCE = ".docs/evidence/07-inspector";

async function loadDemo(page: Page) {
  await page.goto("/");
  await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
  await waitForLayout(page);
}

function viewLabel(page: Page, name: "Before" | "After" | "Both") {
  return page.locator("header").getByText(name, { exact: true });
}

function aside(page: Page) {
  return page.locator("aside");
}

test.describe("slice 7 inspector and actors", () => {
  test("Step inspector: Type, Who in both lanes, Robot in Before", async ({ page }) => {
    await loadDemo(page);
    await page.getByText(DEMO_STEP).first().click();
    await expect(aside(page).getByRole("button", { name: "Type Read" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(aside(page).getByRole("group", { name: "Path: 1 Path vs All Paths" })).toHaveCount(0);
    await expect(aside(page).getByRole("button", { name: "1 Path" })).toHaveCount(0);
    await expect(aside(page).getByRole("button", { name: "Who Alice" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(aside(page).getByRole("button", { name: "Who Robot" })).toBeVisible();
    await expect(aside(page).getByRole("button", { name: "Manage actors" })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/step-who-before-1440.png`,
      animations: "disabled",
    });

    await aside(page).getByRole("button", { name: "Who Robot" }).click();
    await expect(aside(page).getByRole("button", { name: "Who Robot" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.screenshot({
      path: `${EVIDENCE}/who-before-robot-1440.png`,
      animations: "disabled",
    });

    await viewLabel(page, "After").click();
    await page.getByText("Review BS&A Software").first().click();
    await expect(aside(page).getByRole("button", { name: "Who Alice" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await aside(page).getByRole("button", { name: "Who Robot" }).click();
    await expect(aside(page).getByRole("button", { name: "Who Robot" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.screenshot({
      path: `${EVIDENCE}/who-after-1440.png`,
      animations: "disabled",
    });

    await viewLabel(page, "Before").click();
    await page.getByText(DEMO_STEP).first().click();
    await expect(aside(page).getByRole("button", { name: "Who Robot" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("Path inspector is the label field plus Dotted / Solid; Enter edits on the chip", async ({ page }) => {
    await loadDemo(page);
    await page.getByText("invoice > $50,000").first().click();
    await expect(aside(page).locator("#path-condition-field")).toBeVisible();
    await expect(aside(page).getByText("Path / condition", { exact: true })).toHaveCount(0);
    await expect(aside(page).getByRole("button", { name: "Always visited (solid)" })).toHaveCount(0);
    await expect(aside(page).getByRole("button", { name: "Choice (dotted)" })).toHaveCount(0);
    await expect(aside(page).getByRole("group", { name: "Path: 1 Path vs All Paths" })).toHaveCount(0);
    await expect(aside(page).getByRole("button", { name: "1 Path" })).toHaveCount(0);
    await expect(aside(page).getByRole("button", { name: "All Paths" })).toHaveCount(0);
    await expect(aside(page).getByRole("button", { name: "Delete" })).toHaveCount(0);
    const stroke = aside(page).getByRole("group", { name: "Path stroke" });
    await expect(stroke.getByRole("button", { name: "Dotted" })).toHaveAttribute("aria-pressed", "true");
    await expect(stroke.getByRole("button", { name: "Solid" })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/path-condition-1440.png`,
      animations: "disabled",
    });

    await page.keyboard.press("Enter");
    await expect(page.locator("#path-condition-field")).not.toBeFocused();
    await expect(page.locator("#path-chip-editor")).toBeFocused();
    await page.screenshot({
      path: ".docs/evidence/improve-03-polish/path-type-on-chip-1440.png",
      animations: "disabled",
    });

    await stroke.getByRole("button", { name: "Solid" }).click();
    await expect(stroke.getByRole("button", { name: "Solid" })).toHaveAttribute("aria-pressed", "true");
    await expect(aside(page).locator("#path-condition-field")).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/split-every-1440.png`,
      animations: "disabled",
    });
  });

  test("Manage actors deletion blockers; unused Priya can be deleted", async ({ page }) => {
    await loadDemo(page);
    await aside(page).getByRole("button", { name: "Manage actors" }).click();
    await expect(page.getByRole("heading", { name: "Manage actors" })).toBeVisible();
    await aside(page).getByRole("option", { name: "Alice" }).click();
    await aside(page).getByRole("button", { name: "Delete actor" }).click();
    await expect(page.getByText(/Alice is assigned to/)).toBeVisible();
    await expect(aside(page).getByRole("option", { name: "Alice" })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/delete-blocked-1440.png`,
      animations: "disabled",
    });

    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Robot Mailroom" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText("Read incoming mail").first()).toBeVisible({ timeout: 15_000 });
    await aside(page).getByRole("button", { name: "Manage actors" }).click();
    await aside(page).getByRole("option", { name: "Priya" }).click();
    await page.screenshot({
      path: `${EVIDENCE}/manage-actors-1440.png`,
      animations: "disabled",
    });
    await aside(page).getByRole("button", { name: "Delete actor" }).click();
    await expect(aside(page).getByRole("option", { name: "Priya" })).toHaveCount(0);
  });

  test("Data Enter focuses Label; axe on Step inspector", async ({ page }) => {
    await loadDemo(page);
    await page.getByText("Account #").first().click();
    await page.keyboard.press("Enter");
    await expect(page.locator("#data-label-field")).toBeFocused();
    await page.getByText(DEMO_STEP).first().click();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        help: v.help,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  });

  test("Before / After / Both still compare", async ({ page }) => {
    await loadDemo(page);
    await page.screenshot({
      path: `${EVIDENCE}/before-light-1440.png`,
      animations: "disabled",
    });
    await viewLabel(page, "After").click();
    await expect(page.getByText("AFTER", { exact: true })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/after-light-1440.png`,
      animations: "disabled",
    });
    await viewLabel(page, "Both").click();
    await expect(page.getByText("BEFORE", { exact: true })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/both-light-1440.png`,
      animations: "disabled",
    });
  });
});

test.describe("supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("inspector is usable at 1024 CSS pixels", async ({ page }) => {
    await loadDemo(page);
    await page.getByText(DEMO_STEP).first().click();
    await expect(aside(page).getByRole("button", { name: "Who Alice" })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/before-light-1024.png`,
      animations: "disabled",
    });
  });
});
