import { expect, test } from "@playwright/test";
import { loadOakPark } from "./ready";

test.describe("canvas helper hints", () => {
  test("selected Tile shows Q/E and A/D spawn hints, not Right-click Delete", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Read invoice.pdf").first().click();
    const spawn = page.locator("[data-spawn-hints]");
    const helper = page.locator(".canvas-helper");
    await expect(helper).toHaveAttribute("data-helper-dock", "bottom-left");
    await expect(spawn.locator(".canvas-helper-spawn-kind-step")).toHaveText("step");
    await expect(spawn.locator(".canvas-helper-spawn-kind-data")).toHaveText("data");
    await expect(helper).not.toContainText("Right-click");
    const helperBox = await helper.boundingBox();
    expect(helperBox).toBeTruthy();
    expect(helperBox!.x).toBeLessThan(40);
  });

  test("selected Tile does not show Z Remove Step", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Read invoice.pdf").first().click();
    await expect(page.locator(".canvas-helper")).not.toContainText("Remove Step");
    await expect(page.locator(".canvas-helper-remove")).toHaveCount(0);
  });

  test("Right-click delete appears to the right without moving the spawn compass", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Read invoice.pdf").first().click();
    const spawn = page.locator("[data-spawn-hints]");
    const before = await spawn.boundingBox();
    expect(before).toBeTruthy();

    await page.getByRole("button", { name: "Right-click delete" }).click();
    await expect(page.locator(".canvas-helper")).toContainText("Right-click");
    const chip = page.locator(".canvas-helper-cluster > .canvas-helper-chip");
    await expect(chip).toBeVisible();

    const after = await spawn.boundingBox();
    expect(after).toBeTruthy();
    expect(Math.abs(after!.x - before!.x)).toBeLessThan(1);
    expect(Math.abs(after!.y - before!.y)).toBeLessThan(1);
    expect(Math.abs(after!.width - before!.width)).toBeLessThan(1);

    const chipBox = await chip.boundingBox();
    expect(chipBox).toBeTruthy();
    expect(chipBox!.x).toBeGreaterThan(after!.x + after!.width - 1);
  });
});
