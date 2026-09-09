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
  test("+ and Path tabs are 40px", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    const plus = page.getByRole("button", { name: "Add Step or Data" });
    const pathTab = page.getByRole("button", { name: "Pull a Path to an existing Node" });
    await expect(plus).toBeVisible();
    await expect(pathTab).toBeVisible();
    const plusSize = await tabCssSize(plus);
    const pathSize = await tabCssSize(pathTab);
    expect(plusSize).toEqual({ w: 40, h: 40 });
    expect(pathSize).toEqual({ w: 40, h: 40 });

    await capturePage(page, `${EVIDENCE}/selected-tabs-1440.png`);
  });
});
