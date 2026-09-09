import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark } from "./ready";

const EVIDENCE = ".docs/evidence/improve-27-data-purple";
const PURPLE_LIGHT = "rgb(174, 120, 242)";
const PURPLE_DARK = "rgb(201, 166, 255)";
const CORAL_LIGHT = "rgb(232, 120, 74)";
const MISSY = "rgb(200, 155, 245)";

test.describe("Improvement 27 — purple Data mark", () => {
  test("Account # oval is grape purple, not coral, in light and dark", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Account #").first().click();
    const mark = page.locator(".field-piece.selected ellipse").first();
    await expect(mark).toBeVisible();
    await expect
      .poll(async () => mark.evaluate((el) => getComputedStyle(el).fill))
      .toBe(PURPLE_LIGHT);
    await expect
      .poll(async () => mark.evaluate((el) => getComputedStyle(el).fill))
      .not.toBe(CORAL_LIGHT);
    await expect
      .poll(async () => mark.evaluate((el) => getComputedStyle(el).fill))
      .not.toBe(MISSY);
    await capturePage(page, `${EVIDENCE}/data-mark-light-1440.png`);

    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Dark mode" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect
      .poll(async () => mark.evaluate((el) => getComputedStyle(el).fill))
      .toBe(PURPLE_DARK);
    await capturePage(page, `${EVIDENCE}/data-mark-dark-1440.png`);
  });
});
