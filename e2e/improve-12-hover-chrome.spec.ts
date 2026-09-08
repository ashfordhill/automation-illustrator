import { expect, test } from "@playwright/test";
import {
  capturePage,
  loadOakPark,
  tabPeekPoint,
  waitForLayout,
} from "./ready";

const EVIDENCE = ".docs/evidence/improve-12-hover-chrome";
const REVIEW = "Review BS&A Software";

function aside(page: import("@playwright/test").Page) {
  return page.locator("aside");
}

function reviewNode(page: import("@playwright/test").Page) {
  return page.locator('.react-flow__node[data-id="s_review"]');
}

test.describe("Improvement 12 — tile chrome on hover", () => {
  test("hover shows X / + / Path without selecting", async ({ page }) => {
    await loadOakPark(page);
    await expect(page.getByRole("button", { name: "Add Step or Data" })).toHaveCount(0);
    await expect(aside(page).getByRole("button", { name: "Type Review" })).toHaveCount(0);

    await reviewNode(page).locator(".step-piece").hover();
    const plus = reviewNode(page).getByRole("button", { name: "Add Step or Data" });
    const pathTab = reviewNode(page).getByRole("button", { name: "Pull a Path to an existing Node" });
    const remove = reviewNode(page).getByRole("button", { name: `Remove ${REVIEW}` });
    await expect(plus).toBeVisible();
    await expect(pathTab).toBeVisible();
    await expect(remove).toBeVisible();
    await expect(reviewNode(page).locator(".tile-chrome-host.is-selected")).toHaveCount(0);
    await expect(reviewNode(page).locator(".step-piece.selected")).toHaveCount(0);
    await expect(aside(page).getByRole("button", { name: "Type Review" })).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/hover-unselected-1440.png`);

    await page.locator(".react-flow__pane").first().hover({ position: { x: 24, y: 24 } });
    await expect(plus).toHaveCount(0);
    await expect(page.locator(".tile-chrome-host.is-selected")).toHaveCount(0);
  });

  test("selected chrome stays when the pointer leaves; hover does not steal the inspector", async ({
    page,
  }) => {
    await loadOakPark(page);
    await page.getByText("Read invoice.pdf").first().click();
    await expect(aside(page).getByRole("button", { name: "Type Read" })).toBeVisible();
    await page.locator(".react-flow__pane").first().hover({ position: { x: 24, y: 24 } });
    await expect(page.getByRole("button", { name: "Add Step or Data" })).toBeVisible();
    await expect(page.locator(".tile-chrome-host.is-selected")).toHaveCount(1);

    await reviewNode(page).locator(".step-piece").hover();
    await expect(reviewNode(page).getByRole("button", { name: "Add Step or Data" })).toBeVisible();
    await expect(aside(page).getByRole("button", { name: "Type Read" })).toHaveAttribute("aria-pressed", "true");
    await expect(aside(page).getByLabel("Name")).toHaveValue("invoice.pdf");
    await expect(page.locator('.react-flow__node[data-id="s_read"] .tile-chrome-host.is-selected')).toHaveCount(1);
    await expect(reviewNode(page).locator(".tile-chrome-host.is-selected")).toHaveCount(0);
  });

  test("pull + from an unselected hover creates a Step", async ({ page }) => {
    await loadOakPark(page);
    const before = page.locator('.board-lane[data-lane="before"] .react-flow__node');
    const n = await before.count();
    await reviewNode(page).locator(".step-piece").hover();
    const plus = reviewNode(page).getByRole("button", { name: "Add Step or Data" });
    await expect(plus).toBeVisible();
    const box = await plus.boundingBox();
    if (!box) throw new Error("plus tab has no box");
    const grab = tabPeekPoint(box);
    await page.mouse.move(grab.x, grab.y);
    await page.mouse.down();
    await page.mouse.move(grab.x + 140, grab.y, { steps: 12 });
    const preview = page.getByRole("button", { name: "New Step" });
    await expect(preview).toBeVisible();
    const pb = await preview.boundingBox();
    if (!pb) throw new Error("plus preview has no box");
    await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2, { steps: 8 });
    await page.mouse.up();
    await waitForLayout(page);
    await expect(before).toHaveCount(n + 1);
  });

  test("Both hides chrome on hover", async ({ page }) => {
    await loadOakPark(page);
    await page.locator("header").getByText("Both", { exact: true }).click();
    await waitForLayout(page);
    await reviewNode(page).first().locator(".step-piece").hover();
    await expect(page.getByRole("button", { name: "Add Step or Data" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: `Remove ${REVIEW}` })).toHaveCount(0);
  });
});
