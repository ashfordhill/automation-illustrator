import { expect, test } from "@playwright/test";
import {
  loadOakPark,
  screenshotBoard,
  waitForLayout,
  capturePage,
  laneZoom,
  waitForZoomIdle,
} from "./ready";

const EVIDENCE = ".docs/evidence/improve-47-insert-bundle";
/** Drop in the gutter, not on chrome tabs or the host face (flow px). */
const GUTTER_FLOW = 20;

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

async function tileFaceBox(
  page: import("@playwright/test").Page,
  nodeId: string,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const tile = page.locator(`.react-flow__node[data-id="${nodeId}"] .board-node`);
  await expect(tile).toBeVisible();
  const box = await tile.boundingBox();
  if (!box) throw new Error(`${nodeId} face has no box`);
  return box;
}

/**
 * Midpoint of the longest interior run where two Path strokes overlap.
 * Skips the ports so a merge/split coincidence at a handle is not the drop point.
 */
async function overlappingTrunkPoint(
  page: import("@playwright/test").Page,
  idA: string,
  idB: string,
): Promise<{ x: number; y: number } | null> {
  return page.evaluate(
    ({ idA: aId, idB: bId }) => {
      const pathA = document.querySelector(`path#${aId}`) as SVGPathElement | null;
      const pathB = document.querySelector(`path#${bId}`) as SVGPathElement | null;
      if (!pathA || !pathB || !pathA.getScreenCTM() || !pathB.getScreenCTM()) return null;
      const toScreen = (el: SVGPathElement, t: number) => {
        const m = el.getScreenCTM();
        if (!m) return { x: 0, y: 0 };
        const p = el.getPointAtLength(el.getTotalLength() * t);
        return { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f };
      };
      const samples = 48;
      const ptsA: { x: number; y: number }[] = [];
      const ptsB: { x: number; y: number }[] = [];
      for (let i = 0; i <= samples; i++) {
        ptsA.push(toScreen(pathA, i / samples));
        ptsB.push(toScreen(pathB, i / samples));
      }
      const overlap = 6;
      const flags = ptsA.map((p) => {
        let nearest = 1e9;
        for (const q of ptsB) nearest = Math.min(nearest, Math.hypot(p.x - q.x, p.y - q.y));
        return nearest < overlap;
      });
      let bestStart = -1;
      let bestLen = 0;
      let curStart = -1;
      let curLen = 0;
      for (let i = 1; i < samples; i++) {
        if (flags[i]) {
          if (curLen === 0) curStart = i;
          curLen += 1;
          if (curLen > bestLen) {
            bestStart = curStart;
            bestLen = curLen;
          }
        } else {
          curLen = 0;
        }
      }
      if (bestStart < 0 || bestLen < 2) return null;
      const mid = ptsA[bestStart + Math.floor(bestLen / 2)]!;
      return { x: mid.x, y: mid.y };
    },
    { idA, idB },
  );
}

async function mergeGutterPoint(
  page: import("@playwright/test").Page,
  hostId: string,
  edgeA: string,
  edgeB: string,
): Promise<{ x: number; y: number }> {
  await waitForZoomIdle(page);
  const overlap = await overlappingTrunkPoint(page, edgeA, edgeB);
  if (overlap) return overlap;
  const box = await tileFaceBox(page, hostId);
  const zoom = await laneZoom(page);
  return { x: box.x - GUTTER_FLOW * zoom, y: box.y + box.height / 2 };
}

async function splitTrunkPoint(
  page: import("@playwright/test").Page,
  hostId: string,
  edgeA: string,
  edgeB: string,
): Promise<{ x: number; y: number }> {
  await waitForZoomIdle(page);
  const overlap = await overlappingTrunkPoint(page, edgeA, edgeB);
  if (overlap) return overlap;
  const box = await tileFaceBox(page, hostId);
  const zoom = await laneZoom(page);
  return { x: box.x + box.width + GUTTER_FLOW * zoom, y: box.y + box.height / 2 };
}

test.describe("Improvement 47 insert on merge and split trunks", () => {
  test("dropping Write on the Account # merge retargets both incoming Paths", async ({ page }) => {
    await loadOakPark(page);
    const onto = await mergeGutterPoint(page, "d_acct", "e_web_acct", "e_fs_acct");
    await dragTileToward(page, "s_enter", onto.x, onto.y);
    const lane = page.locator(".board-lane").first();
    await expect(lane).toHaveAttribute("data-insert-preview", "true", { timeout: 4_000 });
    await expect(lane).toHaveAttribute("data-insert-kind", "bundle");
    await expect(lane).toHaveAttribute("data-insert-bundle", "merge");
    await expect(page.locator(".insert-bundle-band")).toBeVisible();
    await expect(page.locator(".insert-bundle-band .path-insert-band")).toHaveCount(1);
    await expect(page.locator("[data-insert-silhouette]")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/merge-hover-1440.png`);
    await page.mouse.up();
    await waitForLayout(page);
    await expect(lane).not.toHaveAttribute("data-insert-preview", "true");
    await expect(page.locator("path#e_web_acct")).toHaveCount(1);
    await expect(page.locator("path#e_fs_acct")).toHaveCount(1);
    await expect(page.getByText("BS&A Software").first()).toBeVisible();
    await expect(page.getByText("Account #").first()).toBeVisible();
    const write = await page.locator('.react-flow__node[data-id="s_enter"]').boundingBox();
    const acct = await page.locator('.react-flow__node[data-id="d_acct"]').boundingBox();
    expect(write && acct).toBeTruthy();
    expect(write!.x).toBeLessThan(acct!.x);
    await screenshotBoard(page, `${EVIDENCE}/merge-drop-1440.png`);
  });

  test("shared Read trunk stays a dead zone while dragging a bundled Search", async ({ page }) => {
    await loadOakPark(page);
    const onto = await splitTrunkPoint(page, "s_read", "e_gt", "e_lt");
    await dragTileToward(page, "s_web", onto.x, onto.y);
    const lane = page.locator(".board-lane").first();
    await expect(lane).toHaveAttribute("data-tile-drag", "true");
    await expect(lane).not.toHaveAttribute("data-insert-bundle", "split");
    await expect(lane).not.toHaveAttribute("data-insert-kind", "bundle");
    await expect(lane).not.toHaveAttribute("data-insert-preview", "true");
    await page.mouse.up();
  });

  test("dropping Account # on the Read split trunk inherits both outgoing Paths", async ({
    page,
  }) => {
    await loadOakPark(page);
    const onto = await splitTrunkPoint(page, "s_read", "e_gt", "e_lt");
    await dragTileToward(page, "d_acct", onto.x, onto.y);
    const lane = page.locator(".board-lane").first();
    await expect(lane).toHaveAttribute("data-insert-preview", "true", { timeout: 4_000 });
    await expect(lane).toHaveAttribute("data-insert-kind", "bundle");
    await expect(lane).toHaveAttribute("data-insert-bundle", "split");
    await expect(page.locator(".insert-bundle-band")).toBeVisible();
    await expect(page.locator(".insert-bundle-band .path-insert-band")).toHaveCount(1);
    await capturePage(page, `${EVIDENCE}/split-hover-1440.png`);
    await page.mouse.up();
    await waitForLayout(page);
    await expect(page.getByText("Account #").first()).toBeVisible();
    await expect(page.getByText("invoice > $50,000").first()).toBeVisible();
    await expect(page.getByText("invoice < $50,000").first()).toBeVisible();
    const read = await page.locator('.react-flow__node[data-id="s_read"]').boundingBox();
    const acct = await page.locator('.react-flow__node[data-id="d_acct"]').boundingBox();
    const web = await page.locator('.react-flow__node[data-id="s_web"]').boundingBox();
    expect(read && acct && web).toBeTruthy();
    expect(acct!.x).toBeGreaterThan(read!.x);
    expect(acct!.x).toBeLessThan(web!.x);
    await screenshotBoard(page, `${EVIDENCE}/split-drop-1440.png`);
  });
});

test.describe("Improvement 47 min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("merge bundle hover still works at 1024", async ({ page }) => {
    await loadOakPark(page);
    const onto = await mergeGutterPoint(page, "d_acct", "e_web_acct", "e_fs_acct");
    await dragTileToward(page, "s_enter", onto.x, onto.y);
    const lane = page.locator(".board-lane").first();
    await expect(lane).toHaveAttribute("data-insert-bundle", "merge", { timeout: 4_000 });
    await capturePage(page, `${EVIDENCE}/merge-hover-1024.png`);
    await page.mouse.up();
  });
});
