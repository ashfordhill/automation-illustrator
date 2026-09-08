import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { expect, type Page } from "@playwright/test";

/** Oak Park root Step title as shown on the tile. */
export const DEMO_STEP = "Read invoice.pdf";

/** ELK lays each lane out on a worker; screenshots wait until every lane is `ready` (Improvement 01). */
export async function waitForLayout(page: Page) {
  const hosts = page.locator("[data-layout]");
  await expect(hosts.first()).toBeVisible({ timeout: 15_000 });
  const n = await hosts.count();
  for (let i = 0; i < n; i++) {
    await expect(hosts.nth(i)).toHaveAttribute("data-layout", "ready", {
      timeout: 15_000,
    });
  }
}

export async function loadOakPark(page: Page) {
  await page.goto("/");
  await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
  await waitForLayout(page);
}

/** Write a PNG via buffer so a briefly locked evidence file can be retried (Windows). */
export async function capturePage(page: Page, path: string) {
  const buf = await page.screenshot({ animations: "disabled" });
  await mkdir(dirname(path), { recursive: true });
  let lastErr: unknown;
  for (let i = 0; i < 8; i++) {
    try {
      await writeFile(path, buf);
      return;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 120 * (i + 1)));
    }
  }
  throw lastErr;
}

export async function screenshotBoard(page: Page, path: string) {
  await waitForLayout(page);
  await capturePage(page, path);
}

/** Click the on-tile red X for the selected Node. */
export async function confirmRemoveNode(page: Page, candidateName?: string) {
  if (candidateName) {
    const btn = page.getByRole("button", { name: `Remove ${candidateName}`, exact: true });
    await expect(btn).toBeVisible();
    await btn.click();
    return;
  }
  await page.getByRole("button", { name: /^Remove / }).first().click();
}

/** Drag the selected-tile + tab onto a Step / Data preview (36px pull, then drop). */
export async function pullPlusPreview(page: Page, preview: string) {
  const plus = page.getByRole("button", { name: /Add Step or Data|Add After-only Step/ }).first();
  await expect(plus).toBeVisible();
  const box = await plus.boundingBox();
  if (!box) throw new Error("plus tab has no box");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 140, box.y + box.height / 2, { steps: 12 });
  const previewBtn = page.getByRole("button", { name: preview });
  await expect(previewBtn).toBeVisible();
  const pb = await previewBtn.boundingBox();
  if (!pb) throw new Error("plus preview has no box");
  await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2, { steps: 8 });
  await page.mouse.up();
}

/** Current React Flow zoom (translate/scale or matrix). Defaults to the first lane. */
export async function laneZoom(page: Page, lane?: "before" | "after"): Promise<number> {
  const host = lane
    ? page.locator(`.board-lane[data-lane="${lane}"]`)
    : page.locator(".board-lane").first();
  return host.locator(".react-flow__viewport").evaluate((el) => {
    const t = (el as HTMLElement).style.transform || getComputedStyle(el).transform;
    const scale = t.match(/scale\(([^)]+)\)/);
    if (scale) return Number(scale[1]);
    const matrix = t.match(/matrix\(([^)]+)\)/);
    if (matrix) return Math.abs(Number(matrix[1].split(",")[0]));
    return 1;
  });
}

/** fitView runs after `data-layout=ready`; wait until zoom is no longer animating. */
export async function waitForZoomIdle(page: Page) {
  await expect
    .poll(
      async () => {
        const a = await laneZoom(page);
        await page.waitForTimeout(80);
        const b = await laneZoom(page);
        return Math.abs(a - b);
      },
      { timeout: 4_000 },
    )
    .toBeLessThan(0.01);
}
