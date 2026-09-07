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
