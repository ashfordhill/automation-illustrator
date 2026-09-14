import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark } from "./ready";

const EVIDENCE = ".docs/evidence/improve-65-theme";
const FRAME_DEFAULT = "rgb(12, 51, 73)";
const FRAME_SWATCH = "rgb(128, 32, 32)";

test.describe("Improvement 65 — chrome Theme editor", () => {
  test("Theme edits Frame in the preview; Save applies it and Reset restores the draft", async ({
    page,
  }) => {
    await loadOakPark(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Theme" }).click();
    const dialog = page.getByRole("dialog", { name: "Theme" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("[data-theme-preview]")).toBeVisible();
    await expect(dialog.getByRole("radio", { name: "Vertical" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await dialog.getByRole("button", { name: "Frame color" }).click();
    await page.locator(".inspector-color-pop .mantine-ColorSwatch-root").first().click();
    // Improvement 66: the draft paints only the preview until Save.
    await expect(dialog.locator(".theme-preview-bar")).toHaveCSS("background-color", FRAME_SWATCH);
    await expect(page.locator("footer.status-bar")).toHaveCSS("background-color", FRAME_DEFAULT);
    await dialog.getByRole("button", { name: "Reset" }).click();
    await expect(dialog.locator(".theme-preview-bar")).toHaveCSS("background-color", FRAME_DEFAULT);
    await capturePage(page, `${EVIDENCE}/theme-default-1440.png`);

    await dialog.getByRole("button", { name: "Frame color" }).click();
    await page.locator(".inspector-color-pop .mantine-ColorSwatch-root").first().click();
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    const prompt = page.getByRole("dialog", { name: "Save theme" });
    await prompt.getByRole("textbox", { name: "Name" }).fill("Ember");
    await prompt.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator("footer.status-bar")).toHaveCSS("background-color", FRAME_SWATCH);
    await capturePage(page, `${EVIDENCE}/theme-frame-1440.png`);
  });
});

test.describe("Improvement 65 theme at 1024", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Theme window fits the min supported width", async ({ page }) => {
    await loadOakPark(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Theme" }).click();
    await expect(page.getByRole("dialog", { name: "Theme" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/theme-1024.png`);
  });
});
