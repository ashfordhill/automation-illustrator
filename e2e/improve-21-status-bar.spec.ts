import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { capturePage, loadOakPark, waitForLayout, enterPresent, enterDarkTheme } from "./ready";

const EVIDENCE = ".docs/evidence/improve-21-status-bar";

test.describe("Improvement 21 — bottom status bar", () => {
  test("full-width bar overlaps the inspector with toggle and version", async ({
    page,
  }) => {
    await loadOakPark(page);
    const bar = page.locator("footer.status-bar");
    await expect(bar).toBeVisible();
    await expect(bar.getByText("Oak Park Invoice")).toHaveCount(0);
    await expect(bar.getByRole("button", { name: "Actors", exact: true })).toHaveCount(0);
    const toggle = page.getByRole("button", { name: "Right-click delete" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(toggle).toHaveAttribute("aria-label", "Right-click delete");
    await expect(page.getByLabel("Application version 1.0.0")).toHaveText("v1.0.0");
    const toggleBox = await toggle.boundingBox();
    const versionBox = await page.getByLabel("Application version 1.0.0").boundingBox();
    expect(toggleBox).toBeTruthy();
    expect(versionBox).toBeTruthy();

    const barBox = await bar.boundingBox();
    const asideBox = await page.locator("aside").boundingBox();
    expect(barBox).toBeTruthy();
    expect(asideBox).toBeTruthy();
    expect(barBox!.x).toBeLessThanOrEqual(1);
    expect(toggleBox!.x).toBeGreaterThan(barBox!.x + barBox!.width / 2);
    expect(versionBox!.x).toBeGreaterThan(toggleBox!.x);
    expect(barBox!.x + barBox!.width).toBeGreaterThan(asideBox!.x + 8);
    expect(barBox!.y + barBox!.height).toBeGreaterThanOrEqual(asideBox!.y + asideBox!.height - 2);
    expect(barBox!.y).toBeLessThan(asideBox!.y + asideBox!.height);

    await capturePage(page, `${EVIDENCE}/oak-park-1440.png`);
    const axe = await new AxeBuilder({ page })
      .include("footer.status-bar")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      axe.violations.map((v) => ({
        id: v.id,
        help: v.help,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  });

  test("idle inspector is Actors; Present hides the inspector", async ({
    page,
  }) => {
    await loadOakPark(page);
    await expect(page.locator("aside").getByRole("button", { name: "Add human" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Actors", exact: true })).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/actors-1440.png`);

    await enterPresent(page);
    await expect(page.getByRole("button", { name: "Menu" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Add human" })).toHaveCount(0);
    await page.keyboard.press("Escape");
  });

  test("right-click-delete on removes a Tile; off does not", async ({ page }) => {
    await loadOakPark(page);
    const review = page.getByText("Review BS&A Software").first();
    await review.click({ button: "right" });
    await expect(review).toBeVisible();
    await expect(page.getByTestId("path-menu-delete")).toHaveCount(0);

    const toggle = page.getByRole("button", { name: "Right-click delete" });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await capturePage(page, `${EVIDENCE}/right-click-on-1440.png`);

    await review.click({ button: "right" });
    await expect(page.getByText("Review BS&A Software")).toHaveCount(0);
    await waitForLayout(page);
  });

  test("dark theme status bar stays chunky chrome", async ({ page }) => {
    await loadOakPark(page);
    await enterDarkTheme(page);
    await expect(page.locator("footer.status-bar")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/dark-1440.png`);
  });
});

test.describe("Improvement 21 status bar at 1024", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("bar still spans into the inspector at min width", async ({ page }) => {
    await loadOakPark(page);
    const barBox = await page.locator("footer.status-bar").boundingBox();
    const asideBox = await page.locator("aside").boundingBox();
    expect(barBox).toBeTruthy();
    expect(asideBox).toBeTruthy();
    expect(barBox!.x + barBox!.width).toBeGreaterThan(asideBox!.x + 8);
    await capturePage(page, `${EVIDENCE}/status-bar-1024.png`);
  });
});
