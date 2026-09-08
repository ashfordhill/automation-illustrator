import { expect, test } from "@playwright/test";
import { loadOakPark, screenshotBoard, waitForLayout, capturePage, pathScreenPoint } from "./ready";

const EVIDENCE = ".docs/evidence/improve-10-drag-preview";

async function dragReviewToward(page: import("@playwright/test").Page, x: number, y: number) {
  const tile = page.locator('.react-flow__node[data-id="s_review"] .tile-pickup');
  await expect(tile).toBeVisible();
  const box = await tile.boundingBox();
  if (!box) throw new Error("Review tile has no box");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: 20 });
}

test.describe("Improvement 10 insert preview and move cursor", () => {
  test("hovering an unselected tile uses a move cursor", async ({ page }) => {
    await loadOakPark(page);
    const face = page.locator('.react-flow__node[data-id="s_review"] .step-piece');
    const cursor = await face.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).toMatch(/^move$/);
  });

  test("empty paper and pull tabs use grab", async ({ page }) => {
    await loadOakPark(page);
    const pane = page.locator(".board-lane .react-flow__pane").first();
    const paneCursor = await pane.evaluate((el) => getComputedStyle(el).cursor);
    expect(paneCursor).toMatch(/^grab$/);

    await page.getByText("Review BS&A Software").first().click();
    const plus = page.getByRole("button", { name: "Add Step or Data" });
    await expect(plus).toBeVisible();
    const tabCursor = await plus.evaluate((el) => getComputedStyle(el).cursor);
    expect(tabCursor).toMatch(/^grab$/);
  });

  test("click-dragging an unselected tile inserts on a Path", async ({ page }) => {
    await loadOakPark(page);
    const onto = await pathScreenPoint(page, "e_gt");
    await dragReviewToward(page, onto.x, onto.y);
    await expect(page.locator(".board-lane").first()).toHaveAttribute("data-insert-preview", "true", {
      timeout: 4_000,
    });
    await expect(page.locator(".board-lane").first()).toHaveAttribute("data-tile-drag", "true");
    await expect(page.locator(".path-insert-band")).toBeVisible();
    await expect(page.locator(".path-insert-stub")).toHaveCount(0);
    await expect(page.locator("[data-insert-silhouette]")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/insert-hover-blue-1440.png`);
    await page.mouse.up();
    await expect(page.locator(".board-lane").first()).not.toHaveAttribute(
      "data-insert-preview",
      "true",
    );
    await waitForLayout(page);
    await expect(page.locator("path#e_gt")).toHaveCount(0);
    await expect(page.getByText("invoice > $50,000").first()).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/insert-drop-after-1440.png`);
  });
});
