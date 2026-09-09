import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark } from "./ready";

const EVIDENCE = ".docs/evidence/improve-49-drag-hint";
const REVIEW = "Review BS&A Software";

test.describe("Improvement 49 — no tile-drag hint strip", () => {
  test("dragging a Tile hides Drop and Esc chips", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(REVIEW, { exact: true }).first().click();
    await expect(page.locator(".canvas-helper")).toBeVisible();
    await expect(page.locator("[data-spawn-hints]")).toBeVisible();

    const tile = page.locator('.react-flow__node[data-id="s_review"] .tile-pickup');
    const box = await tile.boundingBox();
    if (!box) throw new Error("Review tile has no box");
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 48, y + 12, { steps: 16 });

    await expect(page.locator(".board-lane").first()).toHaveAttribute("data-tile-drag", "true");
    await expect(page.locator(".canvas-helper")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("Neighbors make a gap");
    await capturePage(page, `${EVIDENCE}/drag-no-hint-1440.png`);
    await page.mouse.up();
  });
});
