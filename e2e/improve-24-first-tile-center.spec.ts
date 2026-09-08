import { expect, test, type Page } from "@playwright/test";
import { capturePage, laneZoom, waitForLayout, waitForZoomIdle } from "./ready";

const EVIDENCE = ".docs/evidence/improve-24-first-tile-center";

async function discardNew(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("menuitem", { name: "New" }).click();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(page.getByText("This board is empty.")).toBeVisible();
}

async function expectTileCenteredInPane(page: Page) {
  await waitForLayout(page);
  await waitForZoomIdle(page);
  const pane = page.locator(".board-lane .react-flow").first();
  const node = page.locator(".react-flow__node").first();
  await expect(node).toBeVisible();
  await expect
    .poll(async () => {
      const pb = await pane.boundingBox();
      const nb = await node.boundingBox();
      if (!pb || !nb) return Number.POSITIVE_INFINITY;
      const dx = pb.x + pb.width / 2 - (nb.x + nb.width / 2);
      const dy = pb.y + pb.height / 2 - (nb.y + nb.height / 2);
      return Math.hypot(dx, dy);
    }, { timeout: 4_000 })
    .toBeLessThan(64);
  expect(await laneZoom(page)).toBeCloseTo(1, 1);
}

test.describe("Improvement 24 — first Tile from New is centered", () => {
  test("Add Step places the Tile in the board center at zoom 1", async ({ page }) => {
    await discardNew(page);
    await page.getByRole("button", { name: "Add Step" }).click();
    await expect(page.getByText("This board is empty.")).toHaveCount(0);
    await expectTileCenteredInPane(page);
    await capturePage(page, `${EVIDENCE}/add-step-centered-1440.png`);
  });

  test("Add Data places the Tile in the board center at zoom 1", async ({ page }) => {
    await discardNew(page);
    await page.getByRole("button", { name: "Add Data" }).click();
    await expect(page.getByText("This board is empty.")).toHaveCount(0);
    await expectTileCenteredInPane(page);
    await capturePage(page, `${EVIDENCE}/add-data-centered-1440.png`);
  });
});
