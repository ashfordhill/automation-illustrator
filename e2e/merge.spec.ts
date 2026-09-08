import { expect, test, type Page } from "@playwright/test";
import { loadOakPark, screenshotBoard, waitForLayout, tabPeekPoint } from "./ready";

const EVIDENCE = ".docs/evidence/11-merge";

function viewLabel(page: Page, name: "Before" | "After" | "Both") {
  return page.locator("header").getByText(name, { exact: true });
}

test.describe("After-only Steps (merge withdrawn)", () => {
  test("After + offers After-only Step, not Data", async ({ page }) => {
    await loadOakPark(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await page.getByText("Read invoice.pdf").first().click();
    const afterPlus = page.getByRole("button", { name: "Add After-only Step" });
    const box = await afterPlus.boundingBox();
    expect(box).toBeTruthy();
    const grab = tabPeekPoint(box!);
    await page.mouse.move(grab.x, grab.y);
    await page.mouse.down();
    await page.mouse.move(grab.x + 140, grab.y, { steps: 12 });
    await expect(page.getByRole("button", { name: "After-only Step" })).toBeVisible();
    await expect(page.getByRole("button", { name: "New Data" })).toHaveCount(0);
    await screenshotBoard(page, `${EVIDENCE}/after-plus-1440.png`);
    await page.mouse.up();
    await page.keyboard.press("Escape");
  });

  test("After-only Step can be added and removed", async ({ page }) => {
    await loadOakPark(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await page.getByText("Read invoice.pdf").first().click();
    await page.keyboard.press("1");
    await waitForLayout(page);
    await expect(page.locator("aside").getByRole("button", { name: "Type Other" })).toBeVisible();
    await page.locator("aside").getByRole("button", { name: "Remove Step" }).click();
    await waitForLayout(page);
    await expect(page.locator("aside").getByRole("button", { name: "Manage actors" })).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/after-only-removed-1440.png`);
  });
});
