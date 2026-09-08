import { expect, test } from "@playwright/test";
import { DEMO_STEP, capturePage, loadOakPark } from "./ready";

const EVIDENCE = ".docs/evidence/improve-15-tab-size";

async function tabCssSize(locator: import("@playwright/test").Locator) {
  return locator.evaluate((el) => {
    const s = getComputedStyle(el);
    return { w: Number.parseFloat(s.width), h: Number.parseFloat(s.height) };
  });
}

test.describe("Improvement 15 — larger + and Path tabs", () => {
  test("+ and Path tabs are 44px and easier to grab", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    const plus = page.getByRole("button", { name: "Add Step or Data" });
    const pathTab = page.getByRole("button", { name: "Pull a Path to an existing Node" });
    await expect(plus).toBeVisible();
    await expect(pathTab).toBeVisible();
    const plusSize = await tabCssSize(plus);
    const pathSize = await tabCssSize(pathTab);
    expect(plusSize).toEqual({ w: 44, h: 44 });
    expect(pathSize).toEqual({ w: 44, h: 44 });

    const peek = await page
      .locator(".tile-chrome-host.is-selected .tile-side-tabs")
      .evaluate((el) => getComputedStyle(el).right);
    expect(peek).toBe("-24px");

    await capturePage(page, `${EVIDENCE}/selected-tabs-1440.png`);
  });
});
