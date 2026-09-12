import { expect, test } from "@playwright/test";
import { DEMO_STEP, capturePage, loadOakPark, pathScreenPoint, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-63-solid-paths";

test.describe("Improvement 63 — new Paths are solid; shorter stroke hints", () => {
  test("a spawned Path is solid and existing dotted Paths stay dotted", async ({ page }) => {
    await loadOakPark(page);
    await expect(page.locator("path#e_gt")).toHaveClass(/path-stroke-dotted/);
    const solidsBefore = await page.locator("path.path-stroke-solid[id]").evaluateAll((els) =>
      [...new Set(els.map((el) => el.id))],
    );
    await page.getByText(DEMO_STEP).first().click();
    await page.keyboard.press("e");
    await waitForLayout(page);
    const solidsAfter = await page.locator("path.path-stroke-solid[id]").evaluateAll((els) =>
      [...new Set(els.map((el) => el.id))],
    );
    expect(solidsAfter.length).toBe(solidsBefore.length + 1);
    await expect(page.locator("path#e_gt")).toHaveClass(/path-stroke-dotted/);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await capturePage(page, `${EVIDENCE}/new-path-solid-1440.png`);
  });

  test("Path helper stroke samples are shorter matching ticks", async ({ page }) => {
    await loadOakPark(page);
    const pt = await pathScreenPoint(page, "e_web_acct", 0.22);
    await page.mouse.click(pt.x, pt.y);
    const helper = page.locator(".canvas-helper [data-stroke-toggle]");
    await expect(helper).toBeVisible();
    await expect(helper.locator("[data-stroke-sample='dotted']")).toHaveAttribute("width", "22");
    await expect(helper.locator("[data-stroke-sample='solid']")).toHaveAttribute("width", "22");
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await capturePage(page, `${EVIDENCE}/path-helper-strokes-1440.png`);
  });
});
