import { expect, test } from "@playwright/test";
import { DEMO_STEP, capturePage, loadOakPark, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-46-inspector-cluster";

function aside(page: import("@playwright/test").Page) {
  return page.locator("aside");
}

test.describe("Improvement 46 — Scan, tall Other, clustered fields", () => {
  test("Type keypad matches Who width; Other is tall; Name has no underline", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();

    const grid = aside(page).locator(".inspector-type-grid");
    const who = aside(page).locator(".inspector-who-groups");
    const fields = aside(page).locator(".inspector-fields");
    await expect(grid.getByRole("button", { name: "Type Scan" })).toBeVisible();
    await expect(grid.getByRole("button", { name: "Type Other" })).toBeVisible();

    const gridBox = await grid.boundingBox();
    const whoBox = await who.boundingBox();
    const fieldsBox = await fields.boundingBox();
    expect(gridBox && whoBox && fieldsBox).toBeTruthy();
    expect(Math.abs(gridBox!.width - whoBox!.width)).toBeLessThan(6);
    expect(Math.abs(fieldsBox!.width - whoBox!.width)).toBeLessThan(6);

    const name = aside(page).locator("#step-name-field");
    const nameBox = aside(page).locator(".inspector-fields .inspector-field-box").first();
    const readWidth = (await nameBox.boundingBox())!.width;
    await expect(name).toHaveCSS("border-bottom-width", "0px");
    await aside(page).getByRole("button", { name: "Type Search" }).click();
    await expect(
      aside(page).locator(".inspector-fields .inspector-field").first().locator(".inspector-field-prefix-label"),
    ).toHaveText("Search");
    const searchWidth = (await nameBox.boundingBox())!.width;
    expect(Math.abs(searchWidth - readWidth)).toBeLessThan(2);
    await aside(page).getByRole("button", { name: "Type Read" }).click();
    await expect(
      aside(page).locator(".inspector-fields .inspector-field").first().locator(".inspector-field-prefix-label"),
    ).toHaveText("Read");

    await capturePage(page, `${EVIDENCE}/cluster-1440.png`);
  });
});

test.describe("Improvement 46 min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("clustered inspector still lines up at 1024", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    await waitForLayout(page);
    const gridBox = await aside(page).locator(".inspector-type-grid").boundingBox();
    const whoBox = await aside(page).locator(".inspector-who-groups").boundingBox();
    expect(gridBox && whoBox).toBeTruthy();
    expect(Math.abs(gridBox!.width - whoBox!.width)).toBeLessThan(6);
    await expect(aside(page).getByRole("button", { name: "Type Scan" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/cluster-1024.png`);
  });
});
