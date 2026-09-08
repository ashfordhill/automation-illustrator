import { expect, test } from "@playwright/test";
import { DEMO_STEP, capturePage, loadOakPark } from "./ready";

const EVIDENCE = ".docs/evidence/improve-22-tab-peek";

test.describe("Improvement 22 — create tabs closer to the tile", () => {
  test("+ and Path tabs peek 14px on the right edge", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    const plus = page.getByRole("button", { name: "Add Step or Data" });
    const pathTab = page.getByRole("button", { name: "Pull a Path to an existing Node" });
    await expect(plus).toBeVisible();
    await expect(pathTab).toBeVisible();

    const peek = await page
      .locator(".tile-chrome-host.is-selected .tile-side-tabs")
      .evaluate((el) => getComputedStyle(el).right);
    expect(peek).toBe("-14px");

    const tile = page.locator(".tile-chrome-host.is-selected .step-piece");
    const tileBox = await tile.boundingBox();
    const plusBox = await plus.boundingBox();
    const pathBox = await pathTab.boundingBox();
    expect(tileBox && plusBox && pathBox).toBeTruthy();
    const tileRight = tileBox!.x + tileBox!.width;
    const plusOverlap = tileRight - plusBox!.x;
    const pathOverlap = tileRight - pathBox!.x;
    expect(plusOverlap / plusBox!.width).toBeGreaterThan(0.6);
    expect(pathOverlap / pathBox!.width).toBeGreaterThan(0.6);
    expect(plusBox!.x + plusBox!.width).toBeGreaterThan(tileRight);
    expect(pathBox!.x + pathBox!.width).toBeGreaterThan(tileRight);

    await capturePage(page, `${EVIDENCE}/selected-tabs-1440.png`);
  });
});
