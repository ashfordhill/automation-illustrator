import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { expect, test } from "@playwright/test";
import { DEMO_STEP, capturePage, loadOakPark, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-50-type-chip";

function aside(page: import("@playwright/test").Page) {
  return page.locator("aside");
}

test.describe("Improvement 50 — Type chip on the right, Name caret room", () => {
  test("Type chip sits right of Name; Name length stays put; caret is not clipped", async ({
    page,
  }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();

    const nameField = aside(page).locator(".inspector-fields .inspector-field").first();
    const nameBox = nameField.locator(".inspector-field-box");
    const prefix = nameField.locator(".inspector-field-prefix");
    const name = aside(page).locator("#step-name-field");

    await expect(prefix).toHaveClass(/has-chip/);
    await expect(prefix.locator(".inspector-field-prefix-label")).toHaveText("Read");

    const boxHit = await nameBox.boundingBox();
    const prefixHit = await prefix.boundingBox();
    expect(boxHit && prefixHit).toBeTruthy();
    expect(prefixHit!.x).toBeGreaterThan(boxHit!.x + boxHit!.width - 2);

    const readWidth = boxHit!.width;
    await aside(page).getByRole("button", { name: "Type Search" }).click();
    await expect(prefix.locator(".inspector-field-prefix-label")).toHaveText("Search");
    const searchWidth = (await nameBox.boundingBox())!.width;
    expect(Math.abs(searchWidth - readWidth)).toBeLessThan(2);

    await name.click();
    await expect(name).toBeFocused();
    const lineHeight = Number.parseFloat(await name.evaluate((el) => getComputedStyle(el).lineHeight));
    const padTop = Number.parseFloat(await nameBox.evaluate((el) => getComputedStyle(el).paddingTop));
    const inputH = (await name.boundingBox())!.height;
    const boxH = (await nameBox.boundingBox())!.height;
    expect(lineHeight).toBeGreaterThanOrEqual(18);
    expect(padTop).toBeGreaterThanOrEqual(8);
    expect(boxH - inputH).toBeGreaterThanOrEqual(12);

    const fields = aside(page).locator(".inspector-fields");
    await mkdir(dirname(`${EVIDENCE}/fields-search-1440.png`), { recursive: true });
    await fields.screenshot({ path: `${EVIDENCE}/fields-search-1440.png`, animations: "disabled" });
    await capturePage(page, `${EVIDENCE}/type-chip-1440.png`);
  });
});

test.describe("Improvement 50 min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Type chip still sits right of Name at 1024", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    await waitForLayout(page);

    const nameField = aside(page).locator(".inspector-fields .inspector-field").first();
    const boxHit = await nameField.locator(".inspector-field-box").boundingBox();
    const prefixHit = await nameField.locator(".inspector-field-prefix").boundingBox();
    expect(boxHit && prefixHit).toBeTruthy();
    expect(prefixHit!.x).toBeGreaterThan(boxHit!.x + boxHit!.width - 2);
    await expect(nameField.locator(".inspector-field-prefix-label")).toHaveText("Read");

    await capturePage(page, `${EVIDENCE}/type-chip-1024.png`);
  });
});
