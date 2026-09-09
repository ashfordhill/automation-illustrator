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
    const geom = await spawn.locator("[data-spawn-compass]").evaluate((el) => {
      const svg = el as SVGSVGElement;
      const shaft = svg.querySelector("line");
      const tick = svg.querySelectorAll("line")[1];
      if (!shaft || !tick) return null;
      return {
        shaftY1: shaft.getAttribute("y1"),
        shaftY2: shaft.getAttribute("y2"),
        tickX1: tick.getAttribute("x1"),
        tickX2: tick.getAttribute("x2"),
      };
    });
    expect(geom).toBeTruthy();
    expect(geom!.shaftY1).toBe(geom!.shaftY2);
    expect(geom!.tickX1).toBe(geom!.tickX2);
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
