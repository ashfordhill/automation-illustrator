import { expect, test } from "@playwright/test";
import { loadOakPark } from "./ready";

test.describe("canvas helper hints", () => {
  test("selected Tile shows Q/E and A/D spawn hints, not Right-click Delete", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Read invoice.pdf").first().click();
    const spawn = page.locator("[data-spawn-hints]");
    await expect(spawn).toContainText("+ Step");
    await expect(spawn).toContainText("+ Data");
    await expect(page.locator(".canvas-helper")).not.toContainText("Right-click");
  });
});
