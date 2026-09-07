import { expect, test, type Page } from "@playwright/test";
import { DEMO_STEP, loadOakPark, screenshotBoard, waitForLayout, confirmRemoveNode } from "./ready";

const EVIDENCE = ".docs/evidence/improve-01-layout";

/** Parse the M/L polyline FlowArrow writes into `path#<edgeId>`. */
async function routeOf(page: Page, edgeId: string): Promise<{ x: number; y: number }[]> {
  const d = await page.locator(`path#${edgeId}`).getAttribute("d");
  expect(d, `route for ${edgeId}`).toBeTruthy();
  const nums = d!.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push({ x: nums[i]!, y: nums[i + 1]! });
  return pts;
}

function expectOrthogonal(pts: { x: number; y: number }[]) {
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    expect(a.x === b.x || a.y === b.y, `diagonal segment ${JSON.stringify([a, b])}`).toBe(true);
  }
}

function viewLabel(page: Page, name: "Before" | "After" | "Both") {
  return page.locator("header").getByText(name, { exact: true });
}

function aside(page: Page) {
  return page.locator("aside");
}

const STRESS = {
  version: 2,
  actors: [{ id: "h1", kind: "human", name: "Ada", color: "#f4c6d4", role: "worker" }],
  nodes: Array.from({ length: 15 }, (_, i) => ({
    id: `s${i}`,
    type: "step",
    position: { x: 32 + (i % 5) * 320, y: 32 + Math.floor(i / 5) * 220 },
    stepKind: "other",
    title: `step ${i}`,
    detail: "",
    split: "exclusive",
  })),
  edges: Array.from({ length: 14 }, (_, i) => ({
    id: `e${i}`,
    source: `s${i}`,
    target: `s${i + 1}`,
    label: i % 4 === 0 ? `condition ${i} is a fairly long choice` : "",
  })),
  assignments: Object.fromEntries(Array.from({ length: 15 }, (_, i) => [`s${i}`, "h1"])),
  after: { assignments: {}, groups: [], extraNodes: [], extraEdges: [] },
};

/** Three labeled branches with long, wrapping conditions (chip-spacing evidence). */
const MULTI_EDGE = {
  ...STRESS,
  nodes: STRESS.nodes.slice(0, 5),
  edges: [
    { id: "m0", source: "s0", target: "s1", label: "approved by the finance lead after review" },
    { id: "m1", source: "s0", target: "s2", label: "rejected" },
    { id: "m2", source: "s0", target: "s3", label: "escalate when the amount exceeds the quarterly threshold" },
    { id: "m3", source: "s1", target: "s4", label: "" },
    { id: "m4", source: "s2", target: "s4", label: "" },
    { id: "m5", source: "s3", target: "s4", label: "" },
  ],
  assignments: Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`s${i}`, "h1"])),
};

test.describe("ELK layout and bundled Path routing (Improvement 01)", () => {
  test("fan-out Paths share a trunk and split at right angles; chains are straight", async ({ page }) => {
    await loadOakPark(page);
    const gt = await routeOf(page, "e_gt");
    const lt = await routeOf(page, "e_lt");
    expect(gt[0]).toEqual(lt[0]);
    expect(gt[1]!.x).toBe(lt[1]!.x);
    expectOrthogonal(gt);
    expectOrthogonal(lt);
    const chain = await routeOf(page, "e_enter_review");
    expect(new Set(chain.map((p) => p.y)).size).toBe(1);
  });

  test("+ Step lands in the column right of its source and the lane returns to ready", async ({ page }) => {
    await loadOakPark(page);
    const review = page.getByText("Review BS&A Software").first();
    await review.click();
    const reviewBox = await review.boundingBox();
    await page.getByRole("button", { name: "Add Step, Data, or Connect existing" }).first().click();
    await page.getByRole("menuitem", { name: "1 Step" }).click();
    const started = Date.now();
    await expect(page.locator(".board-lane")).toHaveAttribute("data-layout", "ready", { timeout: 2_000 });
    expect(Date.now() - started).toBeLessThan(2_000);
    const fresh = page.locator(".react-flow__node.selected").first();
    await expect(fresh).toBeVisible();
    const freshBox = await fresh.boundingBox();
    const reviewAfter = await page.getByText("Review BS&A Software").first().boundingBox();
    expect(freshBox!.x).toBeGreaterThan(reviewAfter!.x + reviewBox!.width * 0.5);
    await screenshotBoard(page, `${EVIDENCE}/add-step-1440.png`);
  });

  test("Robot Mailroom After lane lays out", async ({ page }) => {
    await loadOakPark(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Robot Mailroom" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText(DEMO_STEP)).toHaveCount(0);
    await waitForLayout(page);
    await screenshotBoard(page, `${EVIDENCE}/mailroom-dana-card-1440.png`);
    await viewLabel(page, "After").click();
    await expect(page.getByText("AFTER", { exact: true })).toBeVisible();
    await waitForLayout(page);
    await screenshotBoard(page, `${EVIDENCE}/mailroom-after-1440.png`);
  });

  test("long wrapping conditions on sibling branches keep their chips apart", async ({ page }) => {
    await page.addInitScript((doc) => {
      localStorage.setItem("automation-pitch.workflow", JSON.stringify(doc));
    }, MULTI_EDGE);
    await page.goto("/");
    await expect(page.getByText("step 0").first()).toBeVisible({ timeout: 15_000 });
    await waitForLayout(page);
    const a = await page.getByRole("button", { name: "rejected" }).boundingBox();
    const b = await page.getByRole("button", { name: /approved by the finance lead/ }).boundingBox();
    expect(a && b).toBeTruthy();
    const overlapX = Math.min(a!.x + a!.width, b!.x + b!.width) - Math.max(a!.x, b!.x);
    const overlapY = Math.min(a!.y + a!.height, b!.y + b!.height) - Math.max(a!.y, b!.y);
    expect(overlapX <= 0 || overlapY <= 0).toBe(true);
    await screenshotBoard(page, `${EVIDENCE}/wrapping-multi-edge-1440.png`);
  });

  test("Oak Park conditions sit beside Paths and stay clickable", async ({ page }) => {
    await loadOakPark(page);
    const gt = page.getByRole("button", { name: "invoice > $50,000" }).first();
    await expect(gt).toBeVisible();
    const labelBox = await gt.boundingBox();
    const readBox = await page.getByText(DEMO_STEP).first().boundingBox();
    expect(labelBox).toBeTruthy();
    expect(readBox).toBeTruthy();
    const overlapX = Math.min(labelBox!.x + labelBox!.width, readBox!.x + readBox!.width) - Math.max(labelBox!.x, readBox!.x);
    const overlapY = Math.min(labelBox!.y + labelBox!.height, readBox!.y + readBox!.height) - Math.max(labelBox!.y, readBox!.y);
    expect(overlapX <= 0 || overlapY <= 0).toBe(true);

    await screenshotBoard(page, `${EVIDENCE}/before-light-1440.png`);

    await gt.click();
    await expect(aside(page).locator("#path-condition-field")).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/condition-chip-1440.png`);
  });

  test("shortening a condition contracts the lane (CX-05)", async ({ page }) => {
    await loadOakPark(page);
    await page.getByRole("button", { name: "invoice > $50,000" }).first().click();
    const field = aside(page).locator("#path-condition-field");
    await expect(field).toBeVisible();
    const websiteBefore = await page.getByText("Search website").first().boundingBox();
    await field.fill("");
    await field.blur();
    await waitForLayout(page);
    const websiteAfter = await page.getByText("Search website").first().boundingBox();
    expect(websiteBefore).toBeTruthy();
    expect(websiteAfter).toBeTruthy();
    expect(websiteAfter!.x).toBeLessThan(websiteBefore!.x + 8);
    await screenshotBoard(page, `${EVIDENCE}/label-contract-1440.png`);
  });

  test("condition chip stays the Path hit target when zoomed out (CX-02)", async ({ page }) => {
    await loadOakPark(page);
    await page.mouse.move(400, 400);
    await page.mouse.wheel(0, 1800);
    await waitForLayout(page);
    await page.getByRole("button", { name: "invoice > $50,000" }).first().click();
    await expect(aside(page).locator("#path-condition-field")).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/zoom-out-label-1440.png`);
  });

  test("Before / After / Both after routing settles", async ({ page }) => {
    await loadOakPark(page);
    await viewLabel(page, "After").click();
    await expect(page.getByText("AFTER", { exact: true })).toBeVisible();
    await waitForLayout(page);
    await screenshotBoard(page, `${EVIDENCE}/after-light-1440.png`);

    await viewLabel(page, "Both").click();
    await expect(page.getByText("BEFORE", { exact: true })).toBeVisible();
    await waitForLayout(page);
    await screenshotBoard(page, `${EVIDENCE}/both-light-1440.png`);
  });

  test("dark theme routed Paths stay legible (P-09)", async ({ page }) => {
    await loadOakPark(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Dark mode" }).click();
    await waitForLayout(page);
    await screenshotBoard(page, `${EVIDENCE}/before-dark-1440.png`);
  });

  test("removal restitch stretches then settles (CX-06)", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Write BS&A Software").first().click();
    await page.keyboard.press("Delete");
    await confirmRemoveNode(page, "Write BS&A Software");
    await expect(page.getByText("Write BS&A Software")).toHaveCount(0);
    await expect(page.getByText("Review BS&A Software").first()).toBeVisible();
    await waitForLayout(page);
    await screenshotBoard(page, `${EVIDENCE}/restitch-1440.png`);
  });

  test("about 30 Nodes and Paths route without hanging (P-03)", async ({ page }) => {
    await page.addInitScript((doc) => {
      localStorage.setItem("automation-pitch.workflow", JSON.stringify(doc));
    }, STRESS);
    await page.goto("/");
    await expect(page.getByText("step 0").first()).toBeVisible({ timeout: 15_000 });
    const started = Date.now();
    await waitForLayout(page);
    expect(Date.now() - started).toBeLessThan(8_000);
    await screenshotBoard(page, `${EVIDENCE}/stress-30-1440.png`);
  });
});

test.describe("supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("routed board at 1024 CSS pixels", async ({ page }) => {
    await loadOakPark(page);
    await screenshotBoard(page, `${EVIDENCE}/before-light-1024.png`);
  });
});
