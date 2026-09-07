import { expect, type Page } from "@playwright/test";

/** Oak Park root Step title as shown on the tile. */
export const DEMO_STEP = "Read invoice.pdf";

/** Smart Edge v5 routes on a worker; screenshots wait until deferred = 0 (Slice 9). */
export async function waitForRouting(page: Page) {
  const hosts = page.locator("[data-smart-edge]");
  await expect(hosts.first()).toBeVisible({ timeout: 15_000 });
  const n = await hosts.count();
  for (let i = 0; i < n; i++) {
    await expect(hosts.nth(i)).toHaveAttribute("data-smart-edge", "settled", {
      timeout: 15_000,
    });
  }
  const labels = page.locator("[data-labels-ready]");
  const labelCount = await labels.count();
  for (let i = 0; i < labelCount; i++) {
    await expect(labels.nth(i)).toHaveAttribute("data-labels-ready", "true", {
      timeout: 15_000,
    });
  }
}

export async function loadOakPark(page: Page) {
  await page.goto("/");
  await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
  await waitForRouting(page);
}

export async function screenshotBoard(page: Page, path: string) {
  await waitForRouting(page);
  await page.screenshot({ path, animations: "disabled" });
}
