import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark, enterDarkTheme } from "./ready";

const EVIDENCE = ".docs/evidence/improve-30-status-toggle-right";

test.describe("Improvement 30 — Right Click Delete on the right", () => {
  test("toggle sits on the right of the status bar, left of the version", async ({
    page,
  }) => {
    await loadOakPark(page);
    const bar = page.locator("footer.status-bar");
    const toggle = bar.locator(".status-toggle");
    const version = page.getByLabel("Application version 1.0.0");
    await expect(toggle).toHaveText("Right Click Delete");
    await expect(version).toHaveText("v1.0.0");

    const barBox = await bar.boundingBox();
    const toggleBox = await toggle.boundingBox();
    const versionBox = await version.boundingBox();
    expect(barBox).toBeTruthy();
    expect(toggleBox).toBeTruthy();
    expect(versionBox).toBeTruthy();
    const mid = barBox!.x + barBox!.width / 2;
    expect(toggleBox!.x).toBeGreaterThan(mid);
    expect(versionBox!.x).toBeGreaterThan(toggleBox!.x + toggleBox!.width - 1);
    expect(versionBox!.x + versionBox!.width).toBeGreaterThan(barBox!.x + barBox!.width - 24);

    await capturePage(page, `${EVIDENCE}/toggle-right-1440.png`);
  });

  test("toggle stays on the right when on, in dark, and at 1024", async ({ page }) => {
    await loadOakPark(page);
    const toggle = page.locator("footer.status-bar .status-toggle");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await capturePage(page, `${EVIDENCE}/toggle-on-1440.png`);

    await enterDarkTheme(page);
    await expect(page.locator("footer.status-bar")).toBeVisible();
    const barBox = await page.locator("footer.status-bar").boundingBox();
    const toggleBox = await toggle.boundingBox();
    expect(toggleBox!.x).toBeGreaterThan(barBox!.x + barBox!.width / 2);
    await capturePage(page, `${EVIDENCE}/toggle-right-dark-1440.png`);
  });
});

test.describe("Improvement 30 status toggle at 1024", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("toggle remains on the right at min width", async ({ page }) => {
    await loadOakPark(page);
    const barBox = await page.locator("footer.status-bar").boundingBox();
    const toggleBox = await page.locator("footer.status-bar .status-toggle").boundingBox();
    expect(barBox).toBeTruthy();
    expect(toggleBox).toBeTruthy();
    expect(toggleBox!.x).toBeGreaterThan(barBox!.x + barBox!.width / 2);
    await capturePage(page, `${EVIDENCE}/toggle-right-1024.png`);
  });
});
