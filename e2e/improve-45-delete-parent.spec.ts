import { expect, test, type Page } from "@playwright/test";
import { capturePage, loadOakPark, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-45-delete-parent";

async function selectTile(page: Page, id: string) {
  const tile = page.locator(`.react-flow__node[data-id="${id}"]`);
  await tile.click();
  await tile.focus();
  await expect(tile).toHaveClass(/selected/);
}

test.describe("Improvement 45 — Delete selects the parent Tile", () => {
  test("Delete on a leaf selects its parent; a second Delete walks the chain", async ({ page }) => {
    await loadOakPark(page);
    await selectTile(page, "s_review3");
    await page.keyboard.press("Delete");
    await waitForLayout(page);
    await expect(page.locator('.react-flow__node[data-id="s_review3"]')).toHaveCount(0);
    await expect(page.locator('.react-flow__node[data-id="s_review2"]')).toHaveClass(/selected/);
    await capturePage(page, `${EVIDENCE}/parent-selected-1440.png`);

    await page.locator('.react-flow__node[data-id="s_review2"]').focus();
    await page.keyboard.press("Delete");
    await waitForLayout(page);
    await expect(page.locator('.react-flow__node[data-id="s_review2"]')).toHaveCount(0);
    await expect(page.locator('.react-flow__node[data-id="s_review"]')).toHaveClass(/selected/);
  });
});

test.describe("Improvement 45 — min width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Delete still selects the parent at 1024", async ({ page }) => {
    await loadOakPark(page);
    await selectTile(page, "s_review3");
    await page.keyboard.press("Delete");
    await waitForLayout(page);
    await expect(page.locator('.react-flow__node[data-id="s_review2"]')).toHaveClass(/selected/);
    await capturePage(page, `${EVIDENCE}/parent-selected-1024.png`);
  });
});
