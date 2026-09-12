import { expect, test, type Page } from "@playwright/test";
import { expectAxeClean } from "./axe";
import {
  capturePage,
  DEMO_STEP,
  enterPresent,
  loadOakPark,
  showActorsHome,
  waitForLayout,
  waitForZoomIdle,
} from "./ready";

const EVIDENCE = ".docs/evidence/improve-62-idle-actors-orientation";

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

test.describe("Improvement 62 — idle Actors and orientation trees", () => {
  test("idle inspector is the Actors roster with no Back", async ({ page }) => {
    await loadOakPark(page);
    const aside = page.locator("aside");
    await expect(aside.getByRole("button", { name: "Add human" })).toBeVisible();
    await expect(aside.getByRole("button", { name: "Add robot" })).toBeVisible();
    await expect(aside.getByRole("button", { name: "Delete mode" })).toBeVisible();
    await expect(aside.getByRole("button", { name: "Actors", exact: true })).toHaveCount(0);
    await expect(aside.getByRole("button", { name: "Back" })).toHaveCount(0);
    await expect(aside.getByRole("option", { name: "Alice" })).toHaveAttribute("aria-selected", "true");
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await capturePage(page, `${EVIDENCE}/idle-actors-1440.png`);

    await page.getByText(DEMO_STEP).first().click();
    await expect(aside.getByRole("button", { name: "Type Read" })).toBeVisible();
    await expect(aside.getByRole("button", { name: "Remove Step" })).toBeVisible();
    await expect(aside.getByRole("button", { name: "Actors", exact: true })).toHaveCount(0);
    await showActorsHome(page);
    await expect(aside.getByRole("option", { name: "Alice" })).toHaveAttribute("aria-selected", "true");
    await expectAxeClean(page);
  });

  test("orientation trees sit in the status bar and highlight the active layout", async ({
    page,
  }) => {
    await loadOakPark(page);
    await waitForZoomIdle(page);
    const bar = page.locator("footer.status-bar");
    const group = bar.getByRole("radiogroup", { name: "Board orientation" });
    await expect(group).toBeVisible();
    await expect(page.locator("header").getByRole("radiogroup", { name: "Board orientation" })).toHaveCount(
      0,
    );
    const horizontal = group.getByRole("radio", { name: "Horizontal", exact: true });
    const vertical = group.getByRole("radio", { name: "Vertical", exact: true });
    await expect(horizontal).toHaveAttribute("aria-checked", "true");
    await expect(horizontal).toHaveClass(/is-on/);
    await expect(horizontal.locator('svg path[fill="currentColor"]')).toHaveCount(0);
    await expect(vertical.locator('svg path[fill="currentColor"]')).toHaveCount(0);
    await expect(vertical).toHaveAttribute("aria-checked", "false");
    await expect(vertical).not.toHaveClass(/is-on/);
    const barBox = await bar.boundingBox();
    const groupBox = await group.boundingBox();
    expect(barBox && groupBox).toBeTruthy();
    expect(groupBox!.x).toBeLessThan(barBox!.x + barBox!.width / 2);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await capturePage(page, `${EVIDENCE}/orientation-status-1440.png`);
    await capturePage(page, `${EVIDENCE}/orientation-trees-plain-1440.png`);

    await setOrientation(page, "Vertical");
    await expect(vertical).toHaveClass(/is-on/);
    await expect(horizontal).not.toHaveClass(/is-on/);
    const read = page.locator('.react-flow__node[data-id="s_read"]');
    const web = page.locator('.react-flow__node[data-id="s_web"]');
    const readBox = await read.boundingBox();
    const webBox = await web.boundingBox();
    expect(readBox && webBox).toBeTruthy();
    expect(readBox!.y).toBeLessThan(webBox!.y);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await capturePage(page, `${EVIDENCE}/orientation-vertical-1440.png`);

    await enterPresent(page);
    await expect(page.getByRole("radiogroup", { name: "Board orientation" })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(group).toBeVisible();
  });
});

test.describe("Improvement 62 at 1024", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("idle Actors and orientation trees still fit", async ({ page }) => {
    await loadOakPark(page);
    await expect(page.locator("aside").getByRole("button", { name: "Add human" })).toBeVisible();
    await expect(page.locator("footer.status-bar").getByRole("radiogroup", { name: "Board orientation" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/idle-actors-1024.png`);
  });
});
