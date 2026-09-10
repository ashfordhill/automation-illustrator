import { expect, test } from "@playwright/test";
import { expectAxeClean } from "./axe";
import { DEMO_STEP, capturePage, loadOakPark, waitForLayout, enterPresent, enterDarkTheme } from "./ready";

const EVIDENCE = ".docs/evidence/improve-31-present-nav";

test.describe("Improvement 31 — Present hides the nav bar", () => {
  test("Present is full-bleed; Space toggles After; Escape restores chrome", async ({
    page,
  }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    await expect(page.locator("aside").getByRole("button", { name: "Type Read" })).toBeVisible();

    await enterPresent(page);

    await expect(page.getByRole("button", { name: "Menu" })).toHaveCount(0);
    await expect(page.getByRole("radio", { name: "Before", exact: true })).toHaveCount(0);
    await expect(page.locator("footer.status-bar")).toHaveCount(0);
    await expect(page.locator("aside")).toHaveCount(0);
    await expect(page.locator(".board-lane[data-lane='before']")).toBeVisible();
    await expect(page.locator(".board-lane[data-lane='after']")).toBeVisible();
    await expectAxeClean(page);
    await capturePage(page, `${EVIDENCE}/present-light-1440.png`);

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("Space");
    await waitForLayout(page);
    await expect(page.locator("[data-present-expand]")).toHaveAttribute(
      "data-present-expand",
      "before",
    );
    await expect(page.locator('[data-present-pane="after"]')).toHaveAttribute("data-tucked", "true");
    await page.keyboard.press("Space");
    await waitForLayout(page);
    await expect(page.locator("[data-present-expand]")).toHaveAttribute(
      "data-present-expand",
      "after",
    );
    await capturePage(page, `${EVIDENCE}/present-after-1440.png`);

    await page.keyboard.press("Escape");
    await expect(page.locator("[data-present-expand]")).toHaveAttribute(
      "data-present-expand",
      "split",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Present" })).toBeVisible();
    await expect(page.locator("footer.status-bar")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Before", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("aside").getByRole("button", { name: "Type Read" })).toBeVisible();
  });

  test("Present dark theme has no chrome", async ({ page }) => {
    await loadOakPark(page);
    await enterDarkTheme(page);
    await enterPresent(page);
    await expect(page.getByRole("button", { name: "Menu" })).toHaveCount(0);
    await expect(page.locator("footer.status-bar")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/present-dark-1440.png`);
  });
});

test.describe("Improvement 31 Present at 1024", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Present fills the supported min viewport", async ({ page }) => {
    await loadOakPark(page);
    await enterPresent(page);
    await expect(page.getByRole("button", { name: "Menu" })).toHaveCount(0);
    await expect(page.locator("footer.status-bar")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/present-1024.png`);
  });
});
