import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark } from "./ready";

const EVIDENCE = ".docs/evidence/improve-25-data-mark";
const CORAL_LIGHT = "rgb(232, 120, 74)";
const CORAL_DARK = "rgb(240, 148, 104)";
const TEAL_LIGHT = "rgb(29, 184, 168)";

test.describe("Improvement 25 — coral Data mark", () => {
  test("Account # oval is coral, not teal, in light and dark", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Account #").first().click();
    const mark = page.locator(".field-piece.selected ellipse").first();
    await expect(mark).toBeVisible();
    await expect
      .poll(async () => mark.evaluate((el) => getComputedStyle(el).fill))
      .toBe(CORAL_LIGHT);
    await expect
      .poll(async () => mark.evaluate((el) => getComputedStyle(el).fill))
      .not.toBe(TEAL_LIGHT);
    await capturePage(page, `${EVIDENCE}/data-mark-light-1440.png`);

    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Dark mode" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect
      .poll(async () => mark.evaluate((el) => getComputedStyle(el).fill))
      .toBe(CORAL_DARK);
    await capturePage(page, `${EVIDENCE}/data-mark-dark-1440.png`);
  });
});
