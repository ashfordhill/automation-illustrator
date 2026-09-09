import { expect, test } from "@playwright/test";
import { DEMO_STEP, capturePage, loadOakPark, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-39-type-compact";

function aside(page: import("@playwright/test").Page) {
  return page.locator("aside");
}

test.describe("Improvement 39 — packed Type keypad and empty Other Name", () => {
  test("Type keys are packed, centered, and names are unclipped", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    const grid = aside(page).locator(".inspector-type-grid");
    await expect(grid).toBeVisible();

    const review = aside(page).getByRole("button", { name: "Type Review" });
    const name = review.locator(".inspector-type-name");
    await expect(name).toHaveText("Review");
    const clipped = await name.evaluate((el) => el.scrollWidth - el.clientWidth > 1);
    expect(clipped).toBe(false);

    const reviewBox = await review.boundingBox();
    expect(reviewBox).toBeTruthy();
    expect(reviewBox!.height).toBeGreaterThan(30);
    expect(reviewBox!.height).toBeLessThan(56);

    const rail = aside(page).locator(".details-rail-body");
    const railBox = await rail.boundingBox();
    const gridBox = await grid.boundingBox();
    expect(railBox && gridBox).toBeTruthy();
    const left = gridBox!.x - railBox!.x;
    const right = railBox!.x + railBox!.width - (gridBox!.x + gridBox!.width);
    expect(Math.abs(left - right)).toBeLessThan(16);

    await capturePage(page, `${EVIDENCE}/type-keypad-1440.png`);
  });

  test("Other is a blank clipboard and Name does not seed Task", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "New" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await page.getByRole("button", { name: "Add Step" }).click();
    await waitForLayout(page);

    const other = aside(page).getByRole("button", { name: "Type Other" });
    await expect(other).toHaveAttribute("aria-pressed", "true");
    await expect(other.locator("path")).toHaveCount(0);
    await expect(other.locator(".inspector-type-name")).toHaveCount(0);
    await expect(aside(page).locator("#step-name-field")).toHaveValue("");
    await expect(page.getByText("Task", { exact: true })).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/other-empty-1440.png`);
  });
});

test.describe("Improvement 39 — min width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("packed Type keypad still shows full names at 1024", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    const review = aside(page).getByRole("button", { name: "Type Review" });
    await expect(review.locator(".inspector-type-name")).toHaveText("Review");
    const clipped = await review
      .locator(".inspector-type-name")
      .evaluate((el) => el.scrollWidth - el.clientWidth > 1);
    expect(clipped).toBe(false);
    await capturePage(page, `${EVIDENCE}/type-keypad-1024.png`);
  });
});
