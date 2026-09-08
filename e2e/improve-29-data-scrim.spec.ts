import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark, tabPeekPoint } from "./ready";

const EVIDENCE = ".docs/evidence/improve-29-data-scrim";

test.describe("Improvement 29 — Data plus-pull scrim follows Data radius", () => {
  test("scrim hole rx matches the Data tile, not Step’s 14", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Account #").first().click();
    const plus = page.getByRole("button", { name: "Add Step or Data" });
    await expect(plus).toBeVisible();
    const box = await plus.boundingBox();
    expect(box).toBeTruthy();
    const grab = tabPeekPoint(box!);
    await page.mouse.move(grab.x, grab.y);
    await page.mouse.down();
    await page.mouse.move(grab.x + 140, grab.y, { steps: 12 });
    await expect(page.getByRole("button", { name: "New Data" })).toBeVisible();
    await expect(page.locator("[data-plus-scrim]")).toBeVisible();

    const expected = await page.locator(".field-piece.selected").evaluate((el) => {
      const b = el.getBoundingClientRect();
      const cssRx = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius);
      return cssRx * (b.width / (el as HTMLElement).offsetWidth);
    });

    const hole = page.locator(".plus-scrim-svg [data-tile-hole]");
    await expect(hole).toHaveCount(1);
    const rx = Number(await hole.getAttribute("rx"));
    expect(Math.abs(rx - expected)).toBeLessThan(1);
    if (Math.abs(expected - 14) > 1) expect(rx).not.toBe(14);

    await capturePage(page, `${EVIDENCE}/data-plus-scrim-1440.png`);
    await page.mouse.up();
  });
});
