import { expect, test, type Page } from "@playwright/test";
import { expectAxeClean } from "./axe";
import {
  capturePage,
  DEMO_STEP,
  enterPresent,
  loadOakPark,
  waitForLayout,
  waitForZoomIdle,
} from "./ready";

const EVIDENCE = ".docs/evidence/improve-61-orientation";

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

async function tileBox(page: Page, id: string) {
  const box = await page.locator(`.react-flow__node[data-id="${id}"]`).boundingBox();
  expect(box, id).toBeTruthy();
  return box!;
}

test.describe("Improvement 61 — Vertical board orientation", () => {
  test("top-bar toggle lays Oak Park out as a tree; Compare and Present split side-by-side", async ({
    page,
  }) => {
    await loadOakPark(page);
    await waitForZoomIdle(page);
    await expect(page.locator(".board-lane").first()).toHaveAttribute(
      "data-board-orientation",
      "horizontal",
    );
    await expect(page.getByRole("radiogroup", { name: "Board orientation" })).toBeVisible();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/horizontal-before-1440.png`);

    await setOrientation(page, "Vertical");
    await expect(page.locator(".board-lane").first()).toHaveAttribute(
      "data-board-orientation",
      "vertical",
    );
    const read = await tileBox(page, "s_read");
    const web = await tileBox(page, "s_web");
    const fs = await tileBox(page, "s_fs");
    expect(read.y).toBeLessThan(web.y);
    expect(read.y).toBeLessThan(fs.y);
    expect(web.x).toBeLessThan(fs.x);
    await expectAxeClean(page);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/orientation-toggle-1440.png`);
    await capturePage(page, `${EVIDENCE}/vertical-before-1440.png`);

    await page.getByRole("radio", { name: "Compare", exact: true }).click();
    await waitForLayout(page);
    const stack = page.locator(".lane-stack");
    await expect(stack).toHaveAttribute("data-orientation", "vertical");
    await expect(stack).toHaveAttribute("data-stack", "row");
    const beforePane = await page.locator(".lane-before").boundingBox();
    const afterPane = await page.locator(".lane-after").boundingBox();
    expect(beforePane).toBeTruthy();
    expect(afterPane).toBeTruthy();
    expect(beforePane!.x).toBeLessThan(afterPane!.x);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await capturePage(page, `${EVIDENCE}/vertical-compare-1440.png`);

    await page.getByRole("radio", { name: "Before", exact: true }).click();
    await waitForLayout(page);
    await enterPresent(page);
    await waitForLayout(page);
    await expect(page.getByRole("radiogroup", { name: "Board orientation" })).toHaveCount(0);
    await expect(page.locator(".lane-stack")).toHaveAttribute("data-stack", "row");
    await expect(page.locator("[data-present-expand]")).toHaveAttribute(
      "data-present-expand",
      "split",
    );
    const presentBefore = await page.locator('[data-present-pane="before"]').boundingBox();
    const presentAfter = await page.locator('[data-present-pane="after"]').boundingBox();
    expect(presentBefore!.x).toBeLessThan(presentAfter!.x);
    await expect(page.getByRole("button", { name: "Expand Before" })).toBeVisible();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/vertical-present-1440.png`);

    await page.getByRole("button", { name: "Expand Before" }).click();
    await waitForLayout(page);
    await expect(page.locator("[data-present-expand]")).toHaveAttribute(
      "data-present-expand",
      "before",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Present" })).toBeVisible();
  });

  test("Text-only View still works in both orientations", async ({ page }) => {
    await loadOakPark(page);
    const view = page.getByRole("button", { name: "text-only", exact: true });
    await view.click();
    await expect(view).toHaveAttribute("aria-pressed", "true");
    await waitForLayout(page);
    await expect(page.locator(".board-lane").first()).toHaveAttribute("data-simplified", "true");
    await expect(page.locator(".simplified-oval").first()).toBeVisible();

    await setOrientation(page, "Vertical");
    await expect(page.locator(".board-lane").first()).toHaveAttribute(
      "data-board-orientation",
      "vertical",
    );
    await expect(page.locator(".simplified-oval").first()).toBeVisible();
    const read = await tileBox(page, "s_read");
    const web = await tileBox(page, "s_web");
    expect(read.y).toBeLessThan(web.y);
  });
});

test.describe("Improvement 61 at 1024", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Vertical tree fills the supported min viewport", async ({ page }) => {
    await loadOakPark(page);
    await setOrientation(page, "Vertical");
    const read = await tileBox(page, "s_read");
    const web = await tileBox(page, "s_web");
    expect(read.y).toBeLessThan(web.y);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await capturePage(page, `${EVIDENCE}/vertical-1024.png`);
  });
});

test.describe("Improvement 61 vertical spawn compass", () => {
  test("Q/A add Step up/down; E/D add Data; keys stay in the corners", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    const spawn = page.locator("[data-spawn-hints]");
    await expect(spawn).toBeVisible();
    const horizontalBox = await spawn.boundingBox();
    expect(horizontalBox!.x).toBeLessThan(40);
    await capturePage(page, `${EVIDENCE}/helper-bottom-left-1440.png`);
    await setOrientation(page, "Vertical");
    await expect(spawn).toBeVisible();
    await expect(spawn.locator("[data-spawn-arrow='up']")).toBeVisible();
    await expect(spawn.locator("[data-spawn-arrow='down']")).toBeVisible();
    const verticalBox = await spawn.boundingBox();
    expect(horizontalBox && verticalBox).toBeTruthy();
    expect(Math.abs(verticalBox!.height - horizontalBox!.height)).toBeLessThan(6);
    expect(Math.abs(verticalBox!.y - horizontalBox!.y)).toBeLessThan(8);
    const tile = await spawn.locator("[data-spawn-tile]").boundingBox();
    const step = await spawn.locator(".canvas-helper-spawn-kind-step").boundingBox();
    const data = await spawn.locator(".canvas-helper-spawn-kind-data").boundingBox();
    const up = await spawn.locator("[data-spawn-arrow='up']").boundingBox();
    const down = await spawn.locator("[data-spawn-arrow='down']").boundingBox();
    expect(tile).toBeTruthy();
    expect(step!.x).toBeLessThan(tile!.x);
    expect(data!.x).toBeGreaterThan(tile!.x);
    expect(up!.y).toBeLessThan(tile!.y);
    expect(down!.y).toBeGreaterThan(tile!.y);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await capturePage(page, `${EVIDENCE}/vertical-spawn-compass-1440.png`);

    const before = await page.locator(".react-flow__node").count();
    await page.keyboard.press("a");
    await waitForLayout(page);
    expect(await page.locator(".react-flow__node").count()).toBe(before + 1);
    const created = page.locator(".react-flow__node.selected");
    await expect(created.locator(".step-piece")).toHaveCount(1);
    const read = await tileBox(page, "s_read");
    const extra = await created.boundingBox();
    expect(extra!.y).toBeGreaterThan(read.y);
  });
});

test.describe("Improvement 61 vertical + fan", () => {
  test("Data sits left of Step when the + fan is pulled", async ({ page }) => {
    await loadOakPark(page);
    await setOrientation(page, "Vertical");
    await page.getByText(DEMO_STEP).first().click();
    const plus = page.getByRole("button", { name: "Add Step or Data" });
    const rest = await plus.boundingBox();
    expect(rest).toBeTruthy();
    await page.mouse.move(rest!.x + rest!.width / 2, rest!.y + rest!.height / 2);
    await page.mouse.down();
    await page.mouse.move(rest!.x + rest!.width / 2, rest!.y + rest!.height / 2 + 140, {
      steps: 12,
    });
    const step = page.getByRole("button", { name: "New Step" });
    const data = page.getByRole("button", { name: "New Data" });
    await expect(step).toBeVisible();
    await expect(data).toBeVisible();
    const stepBox = await step.boundingBox();
    const dataBox = await data.boundingBox();
    expect(stepBox && dataBox).toBeTruthy();
    expect(dataBox!.x + dataBox!.width / 2).toBeLessThan(stepBox!.x + stepBox!.width / 2);
    await capturePage(page, `${EVIDENCE}/vertical-plus-fan-1440.png`);
    await page.mouse.up();
  });
});

test.describe("Improvement 61 vertical tile chrome", () => {
  test("Path sits before +; X parks off the flow edge", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    const selected = page.locator(".tile-chrome-host.is-selected");
    const out = selected.locator(".tile-side-tabs.is-out");
    const plus = out.getByRole("button", { name: "Add Step or Data" });
    const pathTab = out.getByRole("button", { name: "Pull a Path to an existing Node" });
    await expect(plus).toBeVisible();
    await expect(pathTab).toBeVisible();
    const plusH = await plus.boundingBox();
    const pathH = await pathTab.boundingBox();
    expect(plusH && pathH).toBeTruthy();
    expect(pathH!.y).toBeLessThan(plusH!.y);
    expect(Math.abs(pathH!.x - plusH!.x)).toBeLessThan(8);

    await setOrientation(page, "Vertical");
    await page.getByText(DEMO_STEP).first().click();
    const tile = selected.locator(".step-piece");
    const xBtn = selected.getByRole("button", { name: /Remove / });
    await expect(plus).toBeVisible();
    await expect(pathTab).toBeVisible();
    await expect(xBtn).toBeVisible();
    const tileBox = await tile.boundingBox();
    const xBox = await xBtn.boundingBox();
    const plusBox = await plus.boundingBox();
    const pathBox = await pathTab.boundingBox();
    expect(tileBox && xBox && plusBox && pathBox).toBeTruthy();
    expect(pathBox!.x).toBeLessThan(plusBox!.x);
    expect(Math.abs(pathBox!.y - plusBox!.y)).toBeLessThan(8);
    const tileCy = tileBox!.y + tileBox!.height / 2;
    const xCy = xBox!.y + xBox!.height / 2;
    const tileCx = tileBox!.x + tileBox!.width / 2;
    const xCx = xBox!.x + xBox!.width / 2;
    expect(Math.abs(xCy - tileCy)).toBeLessThan(8);
    expect(xCx).toBeLessThan(tileCx - 20);
    await page.mouse.move(tileBox!.x + tileBox!.width / 2, tileBox!.y + tileBox!.height / 2);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, -120);
    }
    await waitForZoomIdle(page);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);
    await capturePage(page, `${EVIDENCE}/vertical-tile-chrome-1440.png`);
  });
});
