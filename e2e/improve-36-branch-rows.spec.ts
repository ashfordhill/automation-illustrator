import { expect, test } from "@playwright/test";
import { loadOakPark, screenshotBoard, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-36-branch-rows";

test.describe("Improvement 36 — keep branch rows when forking", () => {
  test("Q on Search website keeps that row above Search filesystem", async ({ page }) => {
    await loadOakPark(page);
    const web = page.locator('.react-flow__node[data-id="s_web"]');
    const fs = page.locator('.react-flow__node[data-id="s_fs"]');
    const beforeWeb = await web.boundingBox();
    const beforeFs = await fs.boundingBox();
    expect(beforeWeb).toBeTruthy();
    expect(beforeFs).toBeTruthy();
    expect(beforeWeb!.y).toBeLessThan(beforeFs!.y);

    await web.click();
    await page.keyboard.press("q");
    await waitForLayout(page);
    await expect(page.locator(".react-flow__node")).toHaveCount(9);

    const afterWeb = await web.boundingBox();
    const afterFs = await fs.boundingBox();
    expect(afterWeb).toBeTruthy();
    expect(afterFs).toBeTruthy();
    expect(afterWeb!.y).toBeLessThan(afterFs!.y);

    const created = page.locator(".react-flow__node.selected");
    await expect(created).toHaveCount(1);
    const extraBox = await created.boundingBox();
    expect(extraBox).toBeTruthy();
    expect(extraBox!.x).toBeLessThan(afterWeb!.x);
    expect(extraBox!.y).toBeLessThan(afterFs!.y);

    await screenshotBoard(page, `${EVIDENCE}/left-fork-website-1440.png`);
  });

  test("Q on Search filesystem keeps website above filesystem", async ({ page }) => {
    await loadOakPark(page);
    const web = page.locator('.react-flow__node[data-id="s_web"]');
    const fs = page.locator('.react-flow__node[data-id="s_fs"]');
    await fs.click();
    await page.keyboard.press("q");
    await waitForLayout(page);
    const afterWeb = await web.boundingBox();
    const afterFs = await fs.boundingBox();
    expect(afterWeb!.y).toBeLessThan(afterFs!.y);
    await screenshotBoard(page, `${EVIDENCE}/left-fork-filesystem-1440.png`);
  });

  test("left-fork website at 1024", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await loadOakPark(page);
    await page.locator('.react-flow__node[data-id="s_web"]').click();
    await page.keyboard.press("q");
    await waitForLayout(page);
    const web = await page.locator('.react-flow__node[data-id="s_web"]').boundingBox();
    const fs = await page.locator('.react-flow__node[data-id="s_fs"]').boundingBox();
    expect(web!.y).toBeLessThan(fs!.y);
    await screenshotBoard(page, `${EVIDENCE}/left-fork-website-1024.png`);
  });
});
