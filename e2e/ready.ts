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

export async function screenshotBoard(page: Page, path: string) {
  await waitForLayout(page);
  await page.screenshot({ path, animations: "disabled" });
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
