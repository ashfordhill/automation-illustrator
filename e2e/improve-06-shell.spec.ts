import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loadOakPark, screenshotBoard, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-06-shell";
const DEMO_STEP = "Read invoice.pdf";

test.describe("Improvement 06 Who, trash, Other, chips, hamburger", () => {
  test("Who is fill-only, inspector trash is labeled, Other uses Name, no lane chips", async ({
    page,
  }) => {
    await loadOakPark(page);
    await expect(page.getByText("BEFORE", { exact: true })).toHaveCount(0);
    await expect(page.getByText("AFTER", { exact: true })).toHaveCount(0);
    await screenshotBoard(page, `${EVIDENCE}/no-lane-chip-1440.png`);

    await page.getByText(DEMO_STEP).first().click();
    const aside = page.locator("aside");
    await expect(aside.getByRole("button", { name: "Remove Step" })).toBeVisible();
    await expect(aside.getByRole("button", { name: "Remove", exact: true })).toHaveCount(0);
    const alice = aside.getByRole("button", { name: "Who Alice" });
    await expect(alice).toHaveAttribute("aria-pressed", "true");
    const outline = await alice.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("dashed");
    await screenshotBoard(page, `${EVIDENCE}/who-selected-1440.png`);
    await screenshotBoard(page, `${EVIDENCE}/inspector-trash-1440.png`);

    await page.getByText("Account #").first().click();
    await expect(aside.getByRole("button", { name: "Remove Data" })).toBeVisible();
    await expect(aside.getByRole("button", { name: "Remove", exact: true })).toHaveCount(0);

    await page.getByText(DEMO_STEP).first().click();
    await aside.getByRole("button", { name: "Type Other" }).click();
    await aside.getByLabel("Name").fill("File boxes");
    await waitForLayout(page);
    await expect(page.getByText("File boxes").first()).toBeVisible();
    await expect(page.getByText("Other File boxes")).toHaveCount(0);
    await screenshotBoard(page, `${EVIDENCE}/other-tile-1440.png`);

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

  test("hamburger closes when the pointer moves onto the board", async ({ page }) => {
    await loadOakPark(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("menuitem", { name: "New" })).toBeVisible();
    const items = page.getByRole("menuitem");
    await expect(items.first()).toBeVisible();
    expect(await items.locator("svg").count()).toBe(0);
    const lane = page.locator(".board-lane").first();
    const box = await lane.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box!.x + Math.min(120, box!.width * 0.25), box!.y + box!.height * 0.55);
    await expect(page.getByRole("menuitem", { name: "New" })).toHaveCount(0);
  });
});
