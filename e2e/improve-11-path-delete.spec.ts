import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark, pathScreenPoint, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-11-path-delete";

async function rightClickPath(page: import("@playwright/test").Page, edgeId: string, at = 0.25) {
  const pt = await pathScreenPoint(page, edgeId, at);
  await page.mouse.click(pt.x, pt.y, { button: "right" });
}

test.describe("Improvement 11 Path Delete menu", () => {
  test("selected Path hints include Remove Path and omit Right-click Delete while the toggle is off", async ({ page }) => {
    await loadOakPark(page);
    const pt = await pathScreenPoint(page, "e_web_acct", 0.22);
    await page.mouse.click(pt.x, pt.y);
    const helper = page.locator(".canvas-helper");
    await expect(helper).toContainText("Remove Path");
    await expect(helper).toContainText("Dotted / Solid");
    await expect(helper).not.toContainText("Right-click");
    await capturePage(page, `${EVIDENCE}/path-hints-1440.png`);
  });

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
    await rightClickPath(page, "e_review_3", 0.5);
    const del = page.getByTestId("path-menu-delete");
    await expect(del).toBeVisible();
    await expect(del).toBeDisabled();
    await capturePage(page, `${EVIDENCE}/path-menu-blocked-1440.png`);
    await page.keyboard.press("Escape");
    const pt = await pathScreenPoint(page, "e_review_3", 0.5);
    await page.mouse.click(pt.x, pt.y);
    await page.keyboard.press("Delete");
    await expect(page.getByText(/would split the board into separate workflows/i)).toBeVisible();
  });
});
