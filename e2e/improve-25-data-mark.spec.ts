import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark, enterDarkTheme } from "./ready";

const EVIDENCE = ".docs/evidence/improve-25-data-mark";
const MARK_LIGHT = "rgb(174, 120, 242)";
const MARK_DARK = "rgb(201, 166, 255)";
const TEAL_LIGHT = "rgb(29, 184, 168)";
const CORAL_LIGHT = "rgb(232, 120, 74)";

test.describe("Improvement 25 — Data mark is not teal", () => {
  test("Account # oval is the Data mark color, not teal, in light and dark", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Account #").first().click();
    const mark = page.locator(".field-piece.selected ellipse").first();
    await expect(mark).toBeVisible();
    await expect
      .poll(async () => mark.evaluate((el) => getComputedStyle(el).fill))
      .toBe(MARK_LIGHT);
    await expect
      .poll(async () => mark.evaluate((el) => getComputedStyle(el).fill))
      .not.toBe(TEAL_LIGHT);
    await expect
      .poll(async () => mark.evaluate((el) => getComputedStyle(el).fill))
      .not.toBe(CORAL_LIGHT);
    await capturePage(page, `${EVIDENCE}/data-mark-light-1440.png`);

    await enterDarkTheme(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect
      .poll(async () => mark.evaluate((el) => getComputedStyle(el).fill))
      .toBe(MARK_DARK);
    await capturePage(page, `${EVIDENCE}/data-mark-dark-1440.png`);
  });
});
