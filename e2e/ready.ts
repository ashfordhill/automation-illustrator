import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { expect, type Page } from "@playwright/test";

/** Oak Park root Step title as shown on the tile. */
export const DEMO_STEP = "Read invoice.pdf";

/** ELK lays each lane out on a worker; screenshots wait until every lane is `ready` (Improvement 01 / 59). */
export async function waitForLayout(page: Page) {
  const hosts = page.locator("[data-layout]");
  await expect(hosts.first()).toBeAttached({ timeout: 15_000 });
  const n = await hosts.count();
  for (let i = 0; i < n; i++) {
    await expect(hosts.nth(i)).toHaveAttribute("data-layout", "ready", {
      timeout: 15_000,
    });
    await expect(hosts.nth(i)).toHaveAttribute("data-board", "ready", {
      timeout: 15_000,
    });
  }
}

export async function loadOakPark(page: Page) {
  await page.goto("/");
  await waitForLayout(page);
  await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
}

/** Present is a top-right icon, not a hamburger item. */
export async function enterPresent(page: Page) {
  await page.getByRole("button", { name: "Present" }).click();
}

/** Dark is not a menu item; tests still switch via the in-app theme event. */
export async function enterDarkTheme(page: Page) {
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("automation-pitch-theme", { detail: "dark" }));
  });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
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

/** Screen point on an ELK Path stroke (bbox center can miss a fan-out polyline). */
export async function pathScreenPoint(page: Page, edgeId: string, at = 0.55): Promise<{ x: number; y: number }> {
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
export function tabPeekPoint(box: { x: number; y: number; width: number; height: number }) {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Drag the selected-tile + tab onto a Step / Data preview (36px pull, then drop). */
export async function pullPlusPreview(
  page: Page,
  preview: string,
  side: "out" | "in" = "out",
) {
  const plus = page
    .getByRole("button", {
      name:
        side === "in"
          ? /Add left Step or Data/
          : /Add Step or Data/,
    })
    .first();
  await expect(plus).toBeVisible();
  const box = await plus.boundingBox();
  if (!box) throw new Error("plus tab has no box");
  const grab = tabPeekPoint(box);
  const dx = side === "in" ? -140 : 140;
  await page.mouse.move(grab.x, grab.y);
  await page.mouse.down();
  await page.mouse.move(grab.x + dx, grab.y, { steps: 12 });
  const previewBtn = page.getByRole("button", { name: preview });
  await expect(previewBtn).toBeVisible();
  const pb = await previewBtn.boundingBox();
  if (!pb) throw new Error("plus preview has no box");
  await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2, { steps: 8 });
  await page.mouse.up();
}

type LaneCamera = { x: number; y: number; zoom: number };

function parseLaneCamera(transform: string): LaneCamera {
  const translate = transform.match(/translate\(\s*([^\s,]+)(?:px)?\s*,\s*([^\s,)]+)(?:px)?/);
  const scale = transform.match(/scale\(([^)]+)\)/);
  if (translate && scale) {
    return { x: parseFloat(translate[1]), y: parseFloat(translate[2]), zoom: Number(scale[1]) };
  }
  const matrix = transform.match(/matrix\(([^)]+)\)/);
  if (matrix) {
    const p = matrix[1].split(",").map((n) => Number(n.trim()));
    return { x: p[4] ?? 0, y: p[5] ?? 0, zoom: Math.abs(p[0] ?? 1) };
  }
  return { x: 0, y: 0, zoom: 1 };
}

/** Current React Flow camera (translate + scale). Defaults to the first lane. */
export async function laneCamera(page: Page, lane?: "before" | "after"): Promise<LaneCamera> {
  const host = lane
    ? page.locator(`.board-lane[data-lane="${lane}"]`)
    : page.locator(".board-lane").first();
  const transform = await host.locator(".react-flow__viewport").evaluate((el) => {
    return (el as HTMLElement).style.transform || getComputedStyle(el).transform;
  });
  return parseLaneCamera(transform);
}

/** Current React Flow zoom (translate/scale or matrix). Defaults to the first lane. */
export async function laneZoom(page: Page, lane?: "before" | "after"): Promise<number> {
  return (await laneCamera(page, lane)).zoom;
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
