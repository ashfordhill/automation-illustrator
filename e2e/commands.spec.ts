import { expect, test, type Page } from "@playwright/test";
import { waitForLayout } from "./ready";

const DEMO_STEP = "Read invoice.pdf";
const EVIDENCE = ".docs/evidence/04-commands";

async function loadDemo(page: Page) {
  await page.goto("/");
  await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
  await waitForLayout(page);
}

function viewLabel(page: Page, name: "Before" | "After" | "Both") {
  return page.locator("header").getByText(name, { exact: true });
}

test.describe("slice 4 command evidence", () => {
  test("demo board still compares Before / After / Both", async ({ page }) => {
    await loadDemo(page);
    await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
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
    await expect(page.getByText("AFTER", { exact: true })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/both-light-1440.png`,
      animations: "disabled",
    });
  });

  test("Path inspector has no Delete control; Delete explains Node removal", async ({
    page,
  }) => {
    await loadDemo(page);
    await page.getByText("invoice > $50,000").first().click();
    await expect(page.locator("aside").getByText("Path / condition", { exact: true })).toBeVisible();
    await expect(page.locator("aside").getByRole("button", { name: "Delete" })).toHaveCount(0);
    await page.screenshot({
      path: `${EVIDENCE}/path-no-delete-1440.png`,
      animations: "disabled",
    });

    await page.keyboard.press("Delete");
    await expect(page.getByText(/cannot be removed on its own/i)).toBeVisible();
  });

  test("root removal is blocked with a hint; leaf removal restitches", async ({ page }) => {
    await loadDemo(page);
    await page.getByText(DEMO_STEP).first().click();
    await page.keyboard.press("Delete");
    await expect(page.getByText(/root Node cannot be removed/i)).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/root-blocked-1440.png`,
      animations: "disabled",
    });

    await page.keyboard.press("Escape");
    await page.getByText("Review BS&A Software").first().click();
    await page.keyboard.press("Delete");
    await expect(page.getByRole("button", { name: "Remove Review BS&A Software" })).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Review BS&A Software")).toHaveCount(0);
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();
  });
});

test.describe("supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("demo board is usable at 1024 CSS pixels", async ({ page }) => {
    await loadDemo(page);
    await expect(viewLabel(page, "Before")).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/before-light-1024.png`,
      animations: "disabled",
    });
  });
});
