import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark } from "./ready";

const EVIDENCE = ".docs/evidence/improve-28-fold-hover";
const CREAM_LIGHT = "rgb(247, 252, 254)";
const INK_LIGHT = "rgb(7, 28, 40)";
const YELLOW_LIGHT = "rgb(232, 193, 74)";
const CREAM_DARK = "rgb(30, 51, 64)";
const INK_DARK = "rgb(232, 244, 250)";
const YELLOW_DARK = "rgb(226, 184, 74)";

test.describe("Improvement 28 correction — inspector fold hover", () => {
  test("Hide inspector hover is cream and ink, not yellow", async ({ page }) => {
    await loadOakPark(page);
    const fold = page.getByRole("button", { name: "Hide inspector" });
    await expect(fold).toBeVisible();
    await fold.hover();
    await expect(fold).toHaveCSS("background-color", CREAM_LIGHT);
    await expect(fold).toHaveCSS("color", INK_LIGHT);
    await expect(fold).not.toHaveCSS("background-color", YELLOW_LIGHT);
    await capturePage(page, `${EVIDENCE}/fold-hover-open-1440.png`);

    await fold.click();
    const show = page.getByRole("button", { name: "Show inspector" });
    await expect(show).toBeVisible();
    await show.hover();
    await expect(show).toHaveCSS("background-color", CREAM_LIGHT);
    await expect(show).not.toHaveCSS("background-color", YELLOW_LIGHT);
    await capturePage(page, `${EVIDENCE}/fold-hover-collapsed-1440.png`);
  });

  test("fold hover in dark is cream and ink, not yellow", async ({ page }) => {
    await loadOakPark(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Dark mode" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const fold = page.getByRole("button", { name: "Hide inspector" });
    await fold.hover();
    await expect(fold).toHaveCSS("background-color", CREAM_DARK);
    await expect(fold).toHaveCSS("color", INK_DARK);
    await expect(fold).not.toHaveCSS("background-color", YELLOW_DARK);
    await capturePage(page, `${EVIDENCE}/fold-hover-dark-1440.png`);
  });
});
