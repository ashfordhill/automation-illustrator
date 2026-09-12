import { expect, test } from "@playwright/test";
import { loadOakPark, waitForLayout } from "./ready";

test.describe("sound status toggle and Redo", () => {
  test("Redo sits after Undo; sound sits in the status bar left of the version", async ({
    page,
  }) => {
    await loadOakPark(page);

    const undo = page.getByRole("button", { name: /Undo/ });
    const redo = page.getByRole("button", { name: /Redo/ });
    await expect(undo).toBeVisible();
    await expect(redo).toBeVisible();
    await expect(redo).toBeDisabled();

    const undoBox = await undo.boundingBox();
    const redoBox = await redo.boundingBox();
    expect(undoBox).toBeTruthy();
    expect(redoBox).toBeTruthy();
    expect(redoBox!.x).toBeGreaterThan(undoBox!.x + undoBox!.width - 1);

    const bar = page.locator("footer.status-bar");
    const sound = bar.getByRole("button", { name: "Sound on" });
    const version = page.getByLabel("Application version 1.0.0");
    await expect(sound).toBeVisible();
    await expect(sound).toHaveAttribute("aria-pressed", "true");
    await expect(sound).toHaveClass(/is-on/);

    const soundBox = await sound.boundingBox();
    const versionBox = await version.boundingBox();
    const deleteBox = await bar.getByRole("button", { name: "Right-click delete" }).boundingBox();
    expect(soundBox).toBeTruthy();
    expect(versionBox).toBeTruthy();
    expect(deleteBox).toBeTruthy();
    expect(soundBox!.x).toBeGreaterThan(deleteBox!.x + deleteBox!.width - 1);
    expect(versionBox!.x).toBeGreaterThan(soundBox!.x + soundBox!.width - 1);
    expect(soundBox!.height).toBeLessThanOrEqual(30);

    await page.getByText("Read invoice.pdf").first().click();
    await page.keyboard.press("e");
    await waitForLayout(page);
    await expect(undo).toBeEnabled();
    await undo.click();
    await waitForLayout(page);
    await expect(redo).toBeEnabled();
    await redo.click();
    await waitForLayout(page);
    await expect(redo).toBeDisabled();

    await sound.click();
    const soundOff = bar.getByRole("button", { name: "Sound off" });
    await expect(soundOff).toHaveAttribute("aria-pressed", "false");
    await expect(soundOff).not.toHaveClass(/is-on/);
  });
});
