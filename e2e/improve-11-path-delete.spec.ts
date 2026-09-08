import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark, pathScreenPoint, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-11-path-delete";

async function rightClickPath(page: import("@playwright/test").Page, edgeId: string, at = 0.25) {
  const pt = await pathScreenPoint(page, edgeId, at);
  await page.mouse.click(pt.x, pt.y, { button: "right" });
}

test.describe("Improvement 11 Path Delete menu", () => {
  test("right-click Delete removes a reconverge Path", async ({ page }) => {
    await loadOakPark(page);
    await rightClickPath(page, "e_web_acct", 0.22);
    const del = page.getByTestId("path-menu-delete");
    await expect(del).toBeVisible();
    await expect(del).toBeEnabled();
    await capturePage(page, `${EVIDENCE}/path-menu-delete-1440.png`);
    await del.click();
    await expect(page.locator("path#e_web_acct")).toHaveCount(0);
    await expect(page.getByText("Search website").first()).toBeVisible();
    await expect(page.getByText("Account #").first()).toBeVisible();
    await waitForLayout(page);
    await capturePage(page, `${EVIDENCE}/path-deleted-1440.png`);
  });

  test("Delete on a bridge Path stays disabled and the Delete key explains", async ({ page }) => {
    await loadOakPark(page);
    await rightClickPath(page, "e_gt", 0.65);
    const del = page.getByTestId("path-menu-delete");
    await expect(del).toBeVisible();
    await expect(del).toBeDisabled();
    await capturePage(page, `${EVIDENCE}/path-menu-blocked-1440.png`);
    await page.keyboard.press("Escape");
    await page.getByText("invoice > $50,000").first().click();
    await page.keyboard.press("Delete");
    await expect(page.getByText(/would leave a Tile the root cannot reach/i)).toBeVisible();
  });
});
