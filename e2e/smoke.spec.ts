import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { waitForRouting } from "./ready";

const DEMO_STEP = "Read invoice.pdf";

async function loadDemo(page: Page) {
  await page.goto("/");
  await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
  await waitForRouting(page);
}

/** Mantine hides the radio inputs; the visible labels live in the header. */
function viewLabel(page: Page, name: "Before" | "After" | "Both") {
  return page.locator("header").getByText(name, { exact: true });
}

test.describe("baseline smoke", () => {
  test("app mounts with the Oak Park demo", async ({ page }) => {
    await loadDemo(page);
    await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
    await expect(page.getByText("Select a tile or Path to edit.")).toBeVisible();
    await page.screenshot({
      path: ".docs/evidence/01-harness/before-light-1440.png",
      animations: "disabled",
    });
  });

  test("Before / After / Both view switching", async ({ page }) => {
    await loadDemo(page);
    await viewLabel(page, "After").click();
    await expect(page.getByText("AFTER", { exact: true })).toBeVisible();
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();
    await waitForRouting(page);
    await page.screenshot({
      path: ".docs/evidence/01-harness/after-light-1440.png",
      animations: "disabled",
    });

    await viewLabel(page, "Both").click();
    await expect(page.getByText("BEFORE", { exact: true })).toBeVisible();
    await expect(page.getByText("AFTER", { exact: true })).toBeVisible();
    await waitForRouting(page);
    await page.screenshot({
      path: ".docs/evidence/01-harness/both-light-1440.png",
      animations: "disabled",
    });

    await viewLabel(page, "Before").click();
    await expect(page.getByText("BEFORE", { exact: true })).toBeVisible();
  });

  test("top bar is reachable from the keyboard", async ({ page }) => {
    await loadDemo(page);
    await page.keyboard.press("Tab");
    const inHeader = await page.evaluate(() => {
      const el = document.activeElement;
      return !!el && !!el.closest("header");
    });
    expect(inHeader).toBe(true);

    await page.getByRole("button", { name: "Menu" }).focus();
    await expect(page.getByRole("button", { name: "Menu" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "Present" })).toBeVisible();
    await page.screenshot({
      path: ".docs/evidence/01-harness/hamburger-keyboard-1440.png",
      animations: "disabled",
    });
  });

  test("axe WCAG 2.2 AA on the initial demo state", async ({ page }) => {
    await loadDemo(page);
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
});

test.describe("supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("demo board is usable at 1024 CSS pixels", async ({ page }) => {
    await loadDemo(page);
    await expect(viewLabel(page, "Before")).toBeVisible();
    await page.screenshot({
      path: ".docs/evidence/01-harness/before-light-1024.png",
      animations: "disabled",
    });
  });
});
