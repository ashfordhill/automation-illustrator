import { expect, test } from "@playwright/test";
import { DEMO_STEP, capturePage, loadOakPark, tabPeekPoint } from "./ready";

const EVIDENCE = ".docs/evidence/improve-19-plus-fan";

test.describe("Improvement 19 — closer Step/Data fan", () => {
  test("Step and Data previews sit close to the source tile", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    const plus = page.getByRole("button", { name: "Add Step or Data" });
    const rest = await plus.boundingBox();
    expect(rest).toBeTruthy();
    const restX = rest!.x + rest!.width / 2;
    const grab = tabPeekPoint(rest!);
    await page.mouse.move(grab.x, grab.y);
    await page.mouse.down();
    await page.mouse.move(grab.x + 140, grab.y, { steps: 12 });
    const step = page.getByRole("button", { name: "New Step" });
    const data = page.getByRole("button", { name: "New Data" });
    await expect(step).toBeVisible();
    await expect(data).toBeVisible();
    const stepBox = await step.boundingBox();
    const dataBox = await data.boundingBox();
    expect(stepBox).toBeTruthy();
    expect(dataBox).toBeTruthy();
    const stepCx = stepBox!.x + stepBox!.width / 2;
    expect(stepCx - restX).toBeGreaterThan(70);
    expect(stepCx - restX).toBeLessThan(100);
    expect(dataBox!.x + dataBox!.width / 2).toBeCloseTo(stepCx, 0);
    await capturePage(page, `${EVIDENCE}/plus-fan-close-1440.png`);
    await page.mouse.up();
  });
});
