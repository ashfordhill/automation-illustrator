import { expect, test, type Page } from "@playwright/test";
import { capturePage, loadOakPark, viewSwitchRadio, waitForLayout, waitForZoomIdle } from "./ready";

const EVIDENCE = ".docs/evidence/improve-64-view-icons";

function viewRadio(page: Page, name: "Before" | "After" | "Compare") {
  return viewSwitchRadio(page, name);
}

async function setOrientation(page: Page, value: "Horizontal" | "Vertical") {
  const group = page.getByRole("radiogroup", { name: "Board orientation" });
  await group.getByRole("radio", { name: value, exact: true }).click();
  await expect(group.getByRole("radio", { name: value, exact: true })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await waitForLayout(page);
  await waitForZoomIdle(page);
}

test.describe("Improvement 64 — icon view switch", () => {
  test("Before / After / Compare are Human, Robot, and stacked Compare", async ({ page }) => {
    await loadOakPark(page);
    await waitForZoomIdle(page);
    const group = page.getByRole("radiogroup", { name: "Before, After, or Compare" });
    const before = viewRadio(page, "Before");
    const after = viewRadio(page, "After");
    const compare = viewRadio(page, "Compare");
    await expect(before).toHaveAttribute("aria-checked", "true");
    await expect(before.locator("svg circle")).toBeVisible();
    await expect(after.locator("svg rect")).toBeVisible();
    await expect(compare.locator('[data-compare-layout="stacked"]')).toBeVisible();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await capturePage(page, `${EVIDENCE}/view-icons-before-1440.png`);

    await after.click();
    await expect(after).toHaveAttribute("aria-checked", "true");
    await waitForLayout(page);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await capturePage(page, `${EVIDENCE}/view-icons-after-1440.png`);

    await compare.click();
    await expect(compare).toHaveAttribute("aria-checked", "true");
    await expect(page.locator('.board-lane[data-lane="before"]')).toBeVisible();
    await expect(page.locator('.board-lane[data-lane="after"]')).toBeVisible();
    await waitForLayout(page);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await capturePage(page, `${EVIDENCE}/view-icons-compare-1440.png`);
    await expect(group).toBeVisible();
  });

  test("Vertical Compare uses the side-by-side mark", async ({ page }) => {
    await loadOakPark(page);
    await setOrientation(page, "Vertical");
    const compare = viewRadio(page, "Compare");
    await expect(compare.locator('[data-compare-layout="side"]')).toBeVisible();
    await compare.click();
    await expect(compare).toHaveAttribute("aria-checked", "true");
    await waitForLayout(page);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await capturePage(page, `${EVIDENCE}/view-icons-compare-vertical-1440.png`);
  });
});

test.describe("Improvement 64 at 1024", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("icon view switch still fits", async ({ page }) => {
    await loadOakPark(page);
    await expect(viewRadio(page, "Before")).toBeVisible();
    await expect(viewRadio(page, "Compare").locator('[data-compare-layout="stacked"]')).toBeVisible();
    await capturePage(page, `${EVIDENCE}/view-icons-1024.png`);
  });
});
