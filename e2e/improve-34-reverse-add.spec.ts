import { expect, test } from "@playwright/test";
import {
  DEMO_STEP,
  capturePage,
  loadOakPark,
  pullPlusPreview,
  tabPeekPoint,
  waitForLayout,
} from "./ready";

const EVIDENCE = ".docs/evidence/improve-34-reverse-add";

function viewLabel(page: import("@playwright/test").Page, name: "Before" | "After" | "Compare") {
  return page.locator("header").getByText(name, { exact: true });
}

async function newBoard(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("menuitem", { name: "New" }).click();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(page.getByRole("button", { name: "Add Step" })).toBeVisible();
}

test.describe("Improvement 34 — add Tiles and Paths to the left", () => {
  test("left + fans Step and Data to the left of the tab", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    const plus = page.getByRole("button", { name: "Add left Step or Data", exact: true });
    const rest = await plus.boundingBox();
    expect(rest).toBeTruthy();
    const restX = rest!.x + rest!.width / 2;
    const grab = tabPeekPoint(rest!);
    await page.mouse.move(grab.x, grab.y);
    await page.mouse.down();
    await page.mouse.move(grab.x - 140, grab.y, { steps: 12 });
    const step = page.getByRole("button", { name: "New Step" });
    const data = page.getByRole("button", { name: "New Data" });
    await expect(step).toBeVisible();
    await expect(data).toBeVisible();
    const stepBox = await step.boundingBox();
    expect(stepBox).toBeTruthy();
    const stepCx = stepBox!.x + stepBox!.width / 2;
    expect(restX - stepCx).toBeGreaterThan(70);
    expect(restX - stepCx).toBeLessThan(100);
    await capturePage(page, `${EVIDENCE}/left-plus-fan-1440.png`);
    await page.mouse.up();
  });

  test("Q adds a predecessor Step; E still adds a child to the right", async ({ page }) => {
    await newBoard(page);
    await page.getByRole("button", { name: "Add Step" }).click();
    await waitForLayout(page);
    await page.keyboard.press("q");
    await waitForLayout(page);
    await expect(page.locator(".react-flow__node")).toHaveCount(2);
    const helper = page.locator(".canvas-helper");
    await expect(helper).toContainText("New Step left");
    await expect(helper).toContainText("New Step right");
    await capturePage(page, `${EVIDENCE}/q-predecessor-1440.png`);
    await page.locator(".react-flow__node:not(.selected)").first().click();
    await page.keyboard.press("e");
    await waitForLayout(page);
    await expect(page.locator(".react-flow__node")).toHaveCount(3);
  });

  test("fan-in: two Steps feed one Data", async ({ page }) => {
    await newBoard(page);
    await page.getByRole("button", { name: "Add Step" }).click();
    await waitForLayout(page);
    await page.keyboard.press("d");
    await waitForLayout(page);
    await page.getByText("Data", { exact: true }).first().click();
    await page.keyboard.press("q");
    await waitForLayout(page);
    await expect(page.locator(".react-flow__node")).toHaveCount(3);
    const dataBox = await page.getByText("Data", { exact: true }).first().boundingBox();
    expect(dataBox).toBeTruthy();
    const nodes = page.locator(".react-flow__node");
    const n = await nodes.count();
    const xs: number[] = [];
    for (let i = 0; i < n; i++) {
      const box = await nodes.nth(i).boundingBox();
      if (box) xs.push(box.x);
    }
    const dataX = dataBox!.x;
    const lefts = xs.filter((x) => x < dataX - 8);
    expect(lefts.length).toBeGreaterThanOrEqual(2);
    await capturePage(page, `${EVIDENCE}/fan-in-1440.png`);
  });

  test("After Q adds an After-only Step to the left", async ({ page }) => {
    await loadOakPark(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await page.getByText(DEMO_STEP).first().click();
    await page.keyboard.press("q");
    await waitForLayout(page);
    await expect(page.getByText("Task").first()).toBeVisible();
    await capturePage(page, `${EVIDENCE}/after-left-step-1440.png`);
    await viewLabel(page, "Before").click();
    await waitForLayout(page);
    await expect(page.getByText("Task")).toHaveCount(0);
  });

  test("deleting the last Tile returns the empty board", async ({ page }) => {
    await newBoard(page);
    await page.getByRole("button", { name: "Add Step" }).click();
    await waitForLayout(page);
    await page.keyboard.press("Delete");
    await expect(page.getByRole("button", { name: "Add Step" })).toBeVisible();
    await expect(page.locator(".react-flow__node")).toHaveCount(0);
  });

  test("left + drop creates a predecessor", async ({ page }) => {
    await newBoard(page);
    await page.getByRole("button", { name: "Add Step" }).click();
    await waitForLayout(page);
    await pullPlusPreview(page, "New Step", "in");
    await waitForLayout(page);
    await expect(page.locator(".react-flow__node")).toHaveCount(2);
  });
});

test.describe("Improvement 34 min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("left + is offered at 1024", async ({ page }) => {
    await newBoard(page);
    await page.getByRole("button", { name: "Add Step" }).click();
    await waitForLayout(page);
    await expect(page.getByRole("button", { name: "Add left Step or Data", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Step or Data", exact: true })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/left-tabs-1024.png`);
  });
});
