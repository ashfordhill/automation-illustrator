import { expect, test } from "@playwright/test";
import { loadOakPark, screenshotBoard, waitForLayout, capturePage, pathScreenPoint } from "./ready";

const EVIDENCE = ".docs/evidence/improve-10-drag-preview";

async function dragTileToward(
  page: import("@playwright/test").Page,
  nodeId: string,
  x: number,
  y: number,
) {
  const tile = page.locator(`.react-flow__node[data-id="${nodeId}"] .tile-pickup`);
  await expect(tile).toBeVisible();
  const box = await tile.boundingBox();
  if (!box) throw new Error(`${nodeId} tile has no box`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: 20 });
}

async function dragReviewToward(page: import("@playwright/test").Page, x: number, y: number) {
  await dragTileToward(page, "s_review", x, y);
}

/** Screen point on unique branch of a fan-out Path (away from the shared trunk). */
async function uniqueBranchScreenPoint(
  page: import("@playwright/test").Page,
  edgeId: string,
  avoidId: string,
): Promise<{ x: number; y: number }> {
  const pt = await page.evaluate(
    ({ edgeId: id, avoidId: other }) => {
      const path = document.querySelector(`path#${id}`) as SVGPathElement | null;
      const avoid = document.querySelector(`path#${other}`) as SVGPathElement | null;
      if (!path) return null;
      if (!path.getScreenCTM()) return null;
      const toScreen = (el: SVGPathElement, t: number) => {
        const m = el.getScreenCTM();
        if (!m) return { x: 0, y: 0 };
        const p = el.getPointAtLength(el.getTotalLength() * t);
        return { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f };
      };
      const samples = 32;
      let best: { x: number; y: number; score: number } | null = null;
      for (let i = Math.floor(samples * 0.45); i <= samples; i++) {
        const p = toScreen(path, i / samples);
        let nearest = 1e9;
        if (avoid) {
          for (let j = 0; j <= samples; j++) {
            const q = toScreen(avoid, j / samples);
            nearest = Math.min(nearest, Math.hypot(p.x - q.x, p.y - q.y));
          }
        }
        if (!best || nearest > best.score) best = { x: p.x, y: p.y, score: nearest };
      }
      return best ? { x: best.x, y: best.y } : null;
    },
    { edgeId, avoidId },
  );
  if (!pt) throw new Error(`no unique branch point for ${edgeId}`);
  return pt;
}

test.describe("Improvement 10 insert preview and move cursor", () => {
  test("hovering an unselected tile uses a move cursor", async ({ page }) => {
    await loadOakPark(page);
    const face = page.locator('.react-flow__node[data-id="s_review"] .step-piece');
    const cursor = await face.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).toMatch(/^move$/);
  });

  test("empty paper and pull tabs use a sharp grab cursor", async ({ page }) => {
    await loadOakPark(page);
    const pane = page.locator(".board-lane .react-flow__pane").first();
    const paneCursor = await pane.evaluate((el) => getComputedStyle(el).cursor);
    expect(paneCursor).toMatch(/url\(/);
    expect(paneCursor).toMatch(/grab/);

    await page.getByText("Review BS&A Software").first().click();
    const plus = page.getByRole("button", { name: "Add Step or Data" });
    await expect(plus).toBeVisible();
    const tabCursor = await plus.evaluate((el) => getComputedStyle(el).cursor);
    expect(tabCursor).toMatch(/url\(/);
    expect(tabCursor).toMatch(/grab/);
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

  test("dragging a fan-out child inserts on the sibling Path unique branch", async ({ page }) => {
    await loadOakPark(page);
    const onto = await uniqueBranchScreenPoint(page, "e_lt", "e_gt");
    await dragTileToward(page, "s_web", onto.x, onto.y);
    await expect(page.locator(".board-lane").first()).toHaveAttribute("data-insert-preview", "true", {
      timeout: 4_000,
    });
    await expect(page.locator(".path-insert-band")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/insert-sibling-branch-1440.png`);
    await page.mouse.up();
    await waitForLayout(page);
    await expect(page.locator("path#e_lt")).toHaveCount(0);
    await expect(page.getByText("invoice < $50,000").first()).toBeVisible();
    await expect(page.getByText("Search website").first()).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/insert-sibling-drop-1440.png`);
  });
});
