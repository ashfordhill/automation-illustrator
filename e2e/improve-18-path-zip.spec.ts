import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark, tabPeekPoint, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-18-path-zip";

test.describe("Improvement 18 Path zip vs Tile blip", () => {
  test("Path-pull from the tile tab connects Search website to Search filesystem", async ({
    page,
  }) => {
    await loadOakPark(page);
    await page.getByRole("button", { name: "Sound off" }).click();
    await expect(page.getByRole("button", { name: "Sound on" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    const website = page.locator('.react-flow__node[data-id="s_web"]');
    await website.click();
    const pathTab = website.getByRole("button", { name: "Pull a Path to an existing Node" });
    await expect(pathTab).toBeVisible();
    const tabBox = await pathTab.boundingBox();
    if (!tabBox) throw new Error("Path tab has no box");
    const grab = tabPeekPoint(tabBox);
    await page.mouse.move(grab.x, grab.y);
    await page.mouse.down();

    const filesystem = page.locator('.react-flow__node[data-id="s_fs"]');
    const fsBox = await filesystem.boundingBox();
    if (!fsBox) throw new Error("filesystem tile has no box");
    await page.mouse.move(fsBox.x + fsBox.width / 2, fsBox.y + fsBox.height / 2, { steps: 16 });
    await capturePage(page, `${EVIDENCE}/path-pull-zip-1440.png`);
    await page.mouse.up();
    await waitForLayout(page);

    await expect(page.locator(".react-flow__edge")).toHaveCount(9);
    await expect(page.getByText("Search filesystem").first()).toBeVisible();
    await capturePage(page, `${EVIDENCE}/path-connected-1440.png`);
  });
});
