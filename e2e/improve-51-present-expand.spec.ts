import { expect, test } from "@playwright/test";
import { expectAxeClean } from "./axe";
import { capturePage, enterPresent, loadOakPark, waitForLayout, enterDarkTheme } from "./ready";

const EVIDENCE = ".docs/evidence/improve-51-present-expand";

test.describe("Improvement 51 — Present expand panes", () => {
  test("Present is a Compare split; expand fills one lane; squish returns", async ({ page }) => {
    await loadOakPark(page);
    await enterPresent(page);
    await waitForLayout(page);

    await expect(page.getByRole("button", { name: "Menu" })).toHaveCount(0);
    await expect(page.locator("footer.status-bar")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Expand Before" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Expand After" })).toBeVisible();
    await expect(page.locator('.board-lane[data-lane="before"]')).toBeVisible();
    await expect(page.locator('.board-lane[data-lane="after"]')).toBeVisible();
    await expect(page.locator("[data-present-expand]")).toHaveAttribute(
      "data-present-expand",
      "split",
    );
    await expectAxeClean(page);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/present-split-1440.png`);

    await page.getByRole("button", { name: "Expand Before" }).click();
    await waitForLayout(page);
    await expect(page.locator("[data-present-expand]")).toHaveAttribute(
      "data-present-expand",
      "before",
    );
    await expect(page.locator('[data-present-pane="after"]')).toHaveAttribute("data-tucked", "true");
    await expect(page.getByRole("button", { name: "Show Before and After" })).toBeVisible();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/present-before-expanded-1440.png`);

    await page.getByRole("button", { name: "Show Before and After" }).click();
    await waitForLayout(page);
    await expect(page.locator("[data-present-expand]")).toHaveAttribute(
      "data-present-expand",
      "split",
    );
    await expect(page.getByRole("button", { name: "Expand After" })).toBeVisible();

    await page.getByRole("button", { name: "Expand After" }).click();
    await waitForLayout(page);
    await expect(page.locator("[data-present-expand]")).toHaveAttribute(
      "data-present-expand",
      "after",
    );
    await expect(page.locator('[data-present-pane="before"]')).toHaveAttribute("data-tucked", "true");
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/present-after-expanded-1440.png`);

    await page.keyboard.press("Escape");
    await expect(page.locator("[data-present-expand]")).toHaveAttribute(
      "data-present-expand",
      "split",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Present" })).toBeVisible();
  });

  test("Present expand is chunky in dark theme", async ({ page }) => {
    await loadOakPark(page);
    await enterDarkTheme(page);
    await enterPresent(page);
    await waitForLayout(page);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/present-split-dark-1440.png`);
  });
});

test.describe("Improvement 51 Present expand at 1024", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Present split fills the supported min viewport", async ({ page }) => {
    await loadOakPark(page);
    await enterPresent(page);
    await waitForLayout(page);
    await expect(page.getByRole("button", { name: "Expand Before" })).toBeVisible();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/present-split-1024.png`);
  });
});
