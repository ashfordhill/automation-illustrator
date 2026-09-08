import { expect, test, type Page } from "@playwright/test";
import { loadOakPark, screenshotBoard, waitForLayout, capturePage } from "./ready";

const EVIDENCE = ".docs/evidence/improve-04-insert-preview";
const REVIEW = "Review BS&A Software";

/** Screen point on an ELK Path stroke (bbox center can miss a fan-out polyline). */
async function pathScreenPoint(page: Page, edgeId: string, at = 0.55): Promise<{ x: number; y: number }> {
  const pt = await page.locator(`path#${edgeId}`).evaluate((el, t) => {
    const path = el as SVGPathElement;
    const len = path.getTotalLength();
    const p = path.getPointAtLength(len * Number(t));
    const ctm = path.getScreenCTM();
    if (!ctm) return null;
    return { x: ctm.a * p.x + ctm.c * p.y + ctm.e, y: ctm.b * p.x + ctm.d * p.y + ctm.f };
  }, at);
  if (!pt) throw new Error(`no screen point for ${edgeId}`);
  return pt;
}

async function dragReviewToward(page: Page, x: number, y: number) {
  const tile = page.locator('.react-flow__node[data-id="s_review"] .tile-pickup');
  await expect(tile).toBeVisible();
  const box = await tile.boundingBox();
  if (!box) throw new Error("Review tile has no box");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: 20 });
}

test.describe("Improvement 04 insert-on-Path preview", () => {
  test("dragging Review over a Path shows a gap; drop inserts; empty drop cancels", async ({
    page,
  }) => {
    await loadOakPark(page);
    await page.getByText(REVIEW, { exact: true }).first().click();
    const onto = await pathScreenPoint(page, "e_gt");
    await dragReviewToward(page, onto.x, onto.y);
    await expect(page.locator(".board-lane").first()).toHaveAttribute("data-insert-preview", "true", {
      timeout: 4_000,
    });
    await expect(page.locator("[data-insert-silhouette]")).toBeVisible();
    await expect(page.locator(".tile-drag-ghost")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/insert-hover-gap-1440.png`);
    await page.mouse.up();
    await expect(page.locator(".board-lane").first()).not.toHaveAttribute(
      "data-insert-preview",
      "true",
    );
    await waitForLayout(page);
    await expect(page.locator("path#e_gt")).toHaveCount(0);
    await expect(page.getByText("invoice > $50,000").first()).toBeVisible();
    await expect(page.getByText(REVIEW, { exact: true }).first()).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/insert-drop-after-1440.png`);
  });

  test("empty-canvas drop cancels insert and leaves the graph unchanged", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(REVIEW, { exact: true }).first().click();
    const pane = page.locator(".board-lane").first();
    const paneBox = await pane.boundingBox();
    expect(paneBox).toBeTruthy();
    await dragReviewToward(page, paneBox!.x + 48, paneBox!.y + 28);
    await page.mouse.up();
    await waitForLayout(page);
    await expect(page.locator("path#e_gt")).toBeVisible();
    await expect(page.locator('.react-flow__node[data-id="s_review"]')).toBeVisible();
    await expect(page.locator("path#e_enter_review")).toHaveCount(1);
    await screenshotBoard(page, `${EVIDENCE}/insert-cancel-1440.png`);
  });
});
