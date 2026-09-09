import { expect, test } from "@playwright/test";
import { DEMO_STEP, capturePage, loadOakPark } from "./ready";

const EVIDENCE = ".docs/evidence/improve-43-spawn-compass";

test.describe("Improvement 43 — spawn hint compass", () => {
  test("selected Tile uses a chunky SVG compass without pipe dividers", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    const spawn = page.locator("[data-spawn-hints]");
    await expect(spawn).toContainText("+ Step");
    await expect(spawn).toContainText("+ Data");
    await expect(spawn.locator("[data-spawn-compass]")).toBeVisible();
    await expect(spawn).not.toContainText("|");
    await capturePage(page, `${EVIDENCE}/spawn-compass-1440.png`);
  });
});

test.describe("Improvement 43 — min width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("compass still fits at 1024", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    await expect(page.locator("[data-spawn-compass]")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/spawn-compass-1024.png`);
  });
});
