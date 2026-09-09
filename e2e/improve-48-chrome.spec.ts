import { expect, test } from "@playwright/test";
import { capturePage, enterPresent, loadOakPark } from "./ready";

const EVIDENCE = ".docs/evidence/improve-48-chrome";

test.describe("Improvement 48 — chrome Present Z and menu", () => {
  test("Menu is leftmost, Present is top-right, hamburger omits Present Actors Dark", async ({
    page,
  }) => {
    await loadOakPark(page);
    const menu = page.getByRole("button", { name: "Menu" });
    const undo = page.getByRole("button", { name: /Undo/ });
    const present = page.getByRole("button", { name: "Present" });
    const menuBox = await menu.boundingBox();
    const undoBox = await undo.boundingBox();
    const presentBox = await present.boundingBox();
    expect(menuBox).toBeTruthy();
    expect(undoBox).toBeTruthy();
    expect(presentBox).toBeTruthy();
    expect(menuBox!.x).toBeLessThan(undoBox!.x);
    expect(presentBox!.x).toBeGreaterThan(undoBox!.x + undoBox!.width);
    await expect(present.locator("svg .present-box")).toBeVisible();
    await expect(present.locator("svg .present-figure")).toBeVisible();
    await expect(present.locator("svg .present-leg-knockout")).toHaveCount(0);
    await present.screenshot({ path: `${EVIDENCE}/present-icon-1440.png`, animations: "disabled" });

    await menu.click();
    await expect(page.getByRole("menuitem", { name: "New" })).toBeVisible();
    const items = await page.getByRole("menuitem").allTextContents();
    expect(items.map((t) => t.trim())).toEqual([
      "New",
      "Import",
      "Export",
      "Keybinds",
      "Oak Park Invoice",
      "Robot Mailroom",
    ]);
    await capturePage(page, `${EVIDENCE}/hamburger-1440.png`);
    await page.getByRole("menuitem", { name: "Keybinds" }).click();
    const dialog = page.getByRole("dialog", { name: "Keybinds" });
    await expect(dialog.getByRole("button", { name: "Remove selected Node (Z)" }).first()).toBeVisible();
    await page.keyboard.press("Escape");

    await capturePage(page, `${EVIDENCE}/chrome-1440.png`);
  });

  test("Present icon enters full-bleed Present", async ({ page }) => {
    await loadOakPark(page);
    await enterPresent(page);
    await expect(page.getByRole("button", { name: "Menu" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Present" })).toHaveCount(0);
    await expect(page.locator("footer.status-bar")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/present-1440.png`);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Present" })).toBeVisible();
  });
});

test.describe("Improvement 48 chrome at 1024", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Menu stays left and Present stays right at min width", async ({ page }) => {
    await loadOakPark(page);
    const menuBox = await page.getByRole("button", { name: "Menu" }).boundingBox();
    const presentBox = await page.getByRole("button", { name: "Present" }).boundingBox();
    expect(menuBox!.x).toBeLessThan(80);
    expect(presentBox!.x).toBeGreaterThan(700);
    await capturePage(page, `${EVIDENCE}/chrome-1024.png`);
  });
});
