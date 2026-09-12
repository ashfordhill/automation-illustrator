import { expect, test } from "@playwright/test";
import { DEMO_STEP, capturePage, loadOakPark } from "./ready";

const EVIDENCE = ".docs/evidence/improve-43-spawn-compass";

test.describe("Improvement 43 — spawn hint compass", () => {
  test("selected Tile uses a chunky SVG compass without pipe dividers", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    const spawn = page.locator("[data-spawn-hints]");
    await expect(spawn.locator(".canvas-helper-spawn-kind-step")).toHaveText("step");
    await expect(spawn.locator(".canvas-helper-spawn-kind-data")).toHaveText("data");
    await expect(spawn).toBeVisible();
    await expect(spawn).not.toContainText("|");
    await expect(spawn.locator("[data-spawn-tile]")).toBeVisible();
    await expect(spawn.locator("[data-spawn-arrow='left']")).toBeVisible();
    await expect(spawn.locator("[data-spawn-arrow='right']")).toBeVisible();
    const tile = await spawn.locator("[data-spawn-tile]").boundingBox();
    expect(tile).toBeTruthy();
    expect(tile!.width).toBeGreaterThan(20);
    expect(tile!.height).toBeGreaterThan(12);

    const keySizes = await page.locator(".canvas-helper kbd").evaluateAll((els) =>
      els.map((el) => {
        const b = el.getBoundingClientRect();
        return {
          text: (el.textContent ?? "").trim(),
          w: Math.round(b.width * 10) / 10,
          h: Math.round(b.height * 10) / 10,
        };
      }),
    );
    expect(keySizes.length).toBeGreaterThan(3);
    const height = keySizes[0]!.h;
    for (const k of keySizes) {
      expect(k.h).toBe(height);
    }
    for (const k of keySizes.filter((k) => k.text.length <= 1)) {
      expect(k.w).toBe(k.h);
    }
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
