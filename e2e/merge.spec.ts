import { expect, test, type Page } from "@playwright/test";
import { loadOakPark, screenshotBoard, waitForLayout, tabPeekPoint } from "./ready";

const EVIDENCE = ".docs/evidence/11-merge";

function viewLabel(page: Page, name: "Before" | "After" | "Compare") {
  return page.locator("header").getByRole("radio", { name, exact: true });
}

test.describe("After spawn (merge withdrawn)", () => {
  test("After + offers Step and Data", async ({ page }) => {
    await loadOakPark(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await page.getByText("Read invoice.pdf").first().click();
    const afterPlus = page.getByRole("button", { name: "Add Step or Data" });
    const box = await afterPlus.boundingBox();
    expect(box).toBeTruthy();
    const grab = tabPeekPoint(box!);
    await page.mouse.move(grab.x, grab.y);
    await page.mouse.down();
    await page.mouse.move(grab.x + 140, grab.y, { steps: 12 });
    await expect(page.getByRole("button", { name: "New Step" })).toBeVisible();
    await expect(page.getByRole("button", { name: "New Data" })).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/after-plus-1440.png`);
    await page.mouse.up();
    await page.keyboard.press("Escape");
  });

  test("After Step can be added and removed on the shared graph", async ({ page }) => {
    await loadOakPark(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await page.getByText("Read invoice.pdf").first().click();
    await page.keyboard.press("e");
    await waitForLayout(page);
    await expect(page.locator("aside").getByRole("button", { name: "Type Other" })).toBeVisible();
    await page.locator("aside").getByRole("button", { name: "Remove Step" }).click();
    await waitForLayout(page);
    await expect(page.locator("aside").getByRole("button", { name: "Add human" })).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/after-only-removed-1440.png`);
  });
});
