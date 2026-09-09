import { expect, test } from "@playwright/test";
import { expectAxeClean } from "./axe";
import { DEMO_STEP, capturePage, loadOakPark, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-20-inspector-fold";

function aside(page: import("@playwright/test").Page) {
  return page.locator("aside");
}

test.describe("Improvement 20 — inspector fold", () => {
  test("Hide folds to a ‹ strip; Show restores the inspector", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    await expect(aside(page).getByRole("button", { name: "Type Read" })).toBeVisible();
    const openBox = await aside(page).boundingBox();
    expect(openBox?.width ?? 0).toBeGreaterThan(280);

    await capturePage(page, `${EVIDENCE}/inspector-open-1440.png`);

    await page.getByRole("button", { name: "Hide inspector" }).click();
    await expect(page.getByRole("button", { name: "Show inspector" })).toBeVisible();
    await expect(aside(page).getByRole("button", { name: "Type Read" })).toHaveCount(0);
    await expect
      .poll(async () => (await aside(page).boundingBox())?.width ?? 0)
      .toBeLessThan(48);

    await page.getByText("Review BS&A Software").first().click();
    await expect(page.getByRole("button", { name: "Show inspector" })).toBeVisible();
    await expect(aside(page).getByRole("button", { name: "Type Review" })).toHaveCount(0);

    await capturePage(page, `${EVIDENCE}/inspector-collapsed-1440.png`);

    await page.getByRole("button", { name: "Show inspector" }).click();
    await expect(aside(page).getByRole("button", { name: "Type Review" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hide inspector" })).toBeVisible();
  });

  test("Present still hides the inspector and the strip", async ({ page }) => {
    await loadOakPark(page);
    await page.getByRole("button", { name: "Hide inspector" }).click();
    await expect(page.getByRole("button", { name: "Show inspector" })).toBeVisible();

    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Present" }).click();
    await expect(page.locator("aside")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Show inspector" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Menu" })).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Show inspector" })).toBeVisible();
  });

  test("folded preference survives reload; dark strip and 1024", async ({ page }) => {
    await loadOakPark(page);
    await page.getByRole("button", { name: "Hide inspector" }).click();
    await expect(page.getByRole("button", { name: "Show inspector" })).toBeVisible();
    await page.reload();
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
    await waitForLayout(page);
    await expect(page.getByRole("button", { name: "Show inspector" })).toBeVisible();
    await expectAxeClean(page);

    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Dark mode" }).click();
    await expect(page.getByRole("button", { name: "Show inspector" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/inspector-collapsed-dark-1440.png`);
  });
});

test.describe("Improvement 20 — inspector fold at 1024", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("folded strip is usable at 1024 CSS pixels", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    await page.getByRole("button", { name: "Hide inspector" }).click();
    await expect(page.getByRole("button", { name: "Show inspector" })).toBeVisible();
    await expect
      .poll(async () => (await aside(page).boundingBox())?.width ?? 0)
      .toBeLessThan(48);
    await capturePage(page, `${EVIDENCE}/inspector-collapsed-1024.png`);
    await page.getByRole("button", { name: "Show inspector" }).click();
    await expect(aside(page).getByRole("button", { name: "Type Read" })).toBeVisible();
  });
});
