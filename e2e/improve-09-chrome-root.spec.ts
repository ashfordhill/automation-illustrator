import { expect, test, type Page } from "@playwright/test";
import {
  DEMO_STEP,
  capturePage,
  loadOakPark,
  tabPeekPoint,
  waitForLayout,
} from "./ready";

const EVIDENCE = ".docs/evidence/improve-09-chrome-root";
const REVIEW = "Review BS&A Software";

function viewLabel(page: Page, name: "Before" | "After" | "Both") {
  return page.locator("header").getByText(name, { exact: true });
}

function aside(page: Page) {
  return page.locator("aside");
}

async function openMenu(page: Page) {
  await page.getByRole("button", { name: "Menu" }).click();
}

async function discardNew(page: Page) {
  await openMenu(page);
  await page.getByRole("menuitem", { name: "New" }).click();
  await page.getByRole("button", { name: "Discard" }).click();
}

test.describe("Improvement 09 — tile chrome, Data root, After removal", () => {
  test("centered tabs, shadow select, and solid taffy join", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    await expect(page.getByRole("button", { name: "Add Step or Data" })).toBeVisible();

    const tile = page.locator(".tile-chrome-host.is-selected .step-piece");
    const plus = page.getByRole("button", { name: "Add Step or Data" });
    const pathTab = page.getByRole("button", { name: "Pull a Path to an existing Node" });
    const tileBox = await tile.boundingBox();
    const plusBox = await plus.boundingBox();
    const pathBox = await pathTab.boundingBox();
    expect(tileBox && plusBox && pathBox).toBeTruthy();
    const clusterTop = Math.min(plusBox!.y, pathBox!.y);
    const clusterBottom = Math.max(plusBox!.y + plusBox!.height, pathBox!.y + pathBox!.height);
    const clusterMid = (clusterTop + clusterBottom) / 2;
    const tileMid = tileBox!.y + tileBox!.height / 2;
    expect(Math.abs(clusterMid - tileMid)).toBeLessThan(12);
    expect(plusBox!.x).toBeLessThan(tileBox!.x + tileBox!.width);
    expect(plusBox!.x + plusBox!.width).toBeGreaterThan(tileBox!.x + tileBox!.width);
    const tabZ = await page.locator(".tile-side-tabs").evaluate((el) => Number(getComputedStyle(el).zIndex));
    const faceZ = await page
      .locator(".tile-chrome-host.is-selected .tile-pickup")
      .evaluate((el) => Number(getComputedStyle(el).zIndex));
    expect(tabZ).toBeGreaterThan(faceZ);

    const outline = await tile.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: s.outlineWidth };
    });
    expect(outline.style === "none" || outline.width === "0px").toBe(true);
    const tileShadow = await tile.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(tileShadow).not.toBe("none");
    const shadowLayers = tileShadow.split(/,(?![^()]*\))/).map((p) => p.trim());
    expect(shadowLayers.length).toBeGreaterThanOrEqual(2);
    await capturePage(page, `${EVIDENCE}/selected-tabs-1440.png`);

    const grab = tabPeekPoint(plusBox!);
    await page.mouse.move(grab.x, grab.y);
    await page.mouse.down();
    await page.mouse.move(grab.x + 140, grab.y, { steps: 12 });
    await expect(page.locator("[data-plus-taffy]")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/plus-taffy-solid-1440.png`);
    await page.mouse.up();
    await expect(page.locator("[data-plus-taffy]")).toHaveCount(0);
  });

  test("After remove updates Before; reloading a demo restores the fixture", async ({ page }) => {
    await loadOakPark(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await page.getByText(REVIEW).first().click();
    await page.getByRole("button", { name: `Remove ${REVIEW}` }).click();
    await expect(page.getByText(REVIEW)).toHaveCount(0);
    await viewLabel(page, "Before").click();
    await waitForLayout(page);
    await expect(page.getByText(REVIEW)).toHaveCount(0);

    await page.getByText(DEMO_STEP).first().click();
    await aside(page).getByLabel("Name").fill("messed-up");
    await aside(page).getByLabel("Name").blur();
    await expect(page.getByText("Read messed-up").first()).toBeVisible();
    await openMenu(page);
    await page.getByRole("menuitem", { name: "Oak Park Invoice" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Read messed-up")).toHaveCount(0);
    await waitForLayout(page);
  });

  test("empty board offers Add Data; Data may be the root; sole Tile deletes", async ({ page }) => {
    await loadOakPark(page);
    await discardNew(page);
    await expect(page.getByText("This board is empty.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Step" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Data" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/empty-step-and-data-1440.png`);

    await page.getByRole("button", { name: "Add Data" }).click();
    await waitForLayout(page);
    await expect(page.getByText("This board is empty.")).toHaveCount(0);
    await expect(page.locator(".field-piece")).toHaveCount(1);
    await page.locator(".field-piece").click();
    await expect(aside(page).getByRole("button", { name: "Remove Data" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/data-root-1440.png`);

    await aside(page).getByRole("button", { name: "Remove Data" }).click();
    await expect(page.getByText("This board is empty.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Step" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Data" })).toBeVisible();
  });
});
