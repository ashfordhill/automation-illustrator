import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { DEMO_STEP, capturePage, loadOakPark, pathScreenPoint, tabPeekPoint, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-08-plus-chrome";

function aside(page: import("@playwright/test").Page) {
  return page.locator("aside");
}

test.describe("Improvement 08 plus taffy, tucked tabs, Path stroke", () => {
  test("taffy, tucked tabs, uniform thumbs, empty release, Path stroke draws", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    await expect(page.getByRole("button", { name: "Add Step or Data" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/tabs-tucked-1440.png`);
    await capturePage(page, `${EVIDENCE}/path-tab-1440.png`);
    await capturePage(page, ".docs/evidence/improve-03-polish/path-tab-1440.png");

    const plus = page.getByRole("button", { name: "Add Step or Data" });
    const box = await plus.boundingBox();
    expect(box).toBeTruthy();
    const grab = tabPeekPoint(box!);
    await page.mouse.move(grab.x, grab.y);
    await page.mouse.down();
    await page.mouse.move(grab.x + 140, grab.y, { steps: 12 });
    await expect(page.getByRole("button", { name: "New Step" })).toBeVisible();
    await expect(page.getByRole("button", { name: "New Data" })).toBeVisible();
    await expect(page.locator("[data-plus-taffy]")).toBeVisible();
    await expect(page.locator("[data-plus-wedge]")).toHaveCount(0);
    await expect(page.locator("[data-plus-scrim]")).toBeVisible();
    const stepThumb = page.locator('[data-plus-preview="step"] .plus-preview-thumb');
    const dataThumb = page.locator('[data-plus-preview="data"] .plus-preview-thumb');
    const stepBox = await stepThumb.boundingBox();
    const dataBox = await dataThumb.boundingBox();
    expect(stepBox).toBeTruthy();
    expect(dataBox).toBeTruthy();
    expect(Math.abs(stepBox!.width - dataBox!.width)).toBeLessThan(2);
    expect(Math.abs(stepBox!.height - dataBox!.height)).toBeLessThan(2);
    await capturePage(page, `${EVIDENCE}/plus-taffy-1440.png`);
    await capturePage(page, `${EVIDENCE}/plus-fan-thumbs-1440.png`);

    const pane = page.locator(".board-lane").first();
    const paneBox = await pane.boundingBox();
    expect(paneBox).toBeTruthy();
    await page.mouse.move(paneBox!.x + 36, paneBox!.y + 36, { steps: 6 });
    const released = Date.now();
    await page.mouse.up();
    await expect(page.getByRole("button", { name: "New Step" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "New Data" })).toHaveCount(0);
    await expect(page.locator("[data-plus-scrim]")).toHaveCount(0);
    expect(Date.now() - released).toBeLessThan(250);

    await page.getByText("invoice > $50,000").first().click();
    const stroke = aside(page).getByRole("group", { name: "Path stroke" });
    await expect(stroke.getByRole("button", { name: "Dotted" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("path#e_gt")).toHaveClass(/path-stroke-dotted/);
    await expect(page.locator('[data-path-overlay="e_gt"]')).not.toHaveCount(0);
    await stroke.getByRole("button", { name: "Solid" }).click();
    await expect(stroke.getByRole("button", { name: "Solid" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("path#e_gt")).toHaveClass(/path-stroke-solid/);
    await expect(page.locator('[data-path-overlay="e_gt"]')).toHaveCount(0);
    await expect(page.locator("path#e_lt")).toHaveClass(/path-stroke-dotted/);
    await expect(page.locator('[data-path-overlay="e_lt"]')).not.toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/path-stroke-solid-1440.png`);

    const onto = await pathScreenPoint(page, "e_gt", 0.65);
    await page.mouse.dblclick(onto.x, onto.y);
    await expect(stroke.getByRole("button", { name: "Dotted" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("path#e_gt")).toHaveClass(/path-stroke-dotted/);
    await expect(page.locator('[data-path-overlay="e_gt"]')).not.toHaveCount(0);

    await page.getByText(DEMO_STEP).first().click();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        help: v.help,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  });

  test("empty + release dismisses fan and scrim immediately", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    const plus = page.getByRole("button", { name: "Add Step or Data" });
    const box = await plus.boundingBox();
    expect(box).toBeTruthy();
    const grab = tabPeekPoint(box!);
    await page.mouse.move(grab.x, grab.y);
    await page.mouse.down();
    await page.mouse.move(grab.x + 140, grab.y, { steps: 12 });
    await expect(page.getByRole("button", { name: "New Step" })).toBeVisible();
    await expect(page.locator("[data-plus-scrim]")).toBeVisible();
    const pane = page.locator(".react-flow__pane").first();
    const paneBox = await pane.boundingBox();
    expect(paneBox).toBeTruthy();
    await page.mouse.move(paneBox!.x + 24, paneBox!.y + 24, { steps: 8 });
    const released = Date.now();
    await page.mouse.up();
    await expect(page.getByRole("button", { name: "New Step" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "New Data" })).toHaveCount(0);
    await expect(page.locator("[data-plus-scrim]")).toHaveCount(0);
    expect(Date.now() - released).toBeLessThan(250);
    await waitForLayout(page);
  });
});
