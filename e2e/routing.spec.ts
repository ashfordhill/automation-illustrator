import { expect, test, type Page } from "@playwright/test";
import { DEMO_STEP, loadOakPark, screenshotBoard, waitForRouting } from "./ready";

const EVIDENCE = ".docs/evidence/09-routing";

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

test.describe("slice 9 routing and label layout", () => {
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
    await expect(aside(page).getByText("Path / condition", { exact: true })).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/condition-chip-1440.png`);
  });

  test("shortening a condition contracts the lane (CX-05)", async ({ page }) => {
    await loadOakPark(page);
    await page.getByRole("button", { name: "invoice > $50,000" }).first().click();
    const field = aside(page).getByLabel("condition");
    await expect(field).toBeVisible();
    const websiteBefore = await page.getByText("Search website").first().boundingBox();
    await field.fill("");
    await field.blur();
    await waitForRouting(page);
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
    await waitForRouting(page);
    await page.getByRole("button", { name: "invoice > $50,000" }).first().click();
    await expect(aside(page).getByText("Path / condition", { exact: true })).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/zoom-out-label-1440.png`);
  });

  test("Before / After / Both after routing settles", async ({ page }) => {
    await loadOakPark(page);
    await viewLabel(page, "After").click();
    await expect(page.getByText("AFTER", { exact: true })).toBeVisible();
    await waitForRouting(page);
    await screenshotBoard(page, `${EVIDENCE}/after-light-1440.png`);

    await viewLabel(page, "Both").click();
    await expect(page.getByText("BEFORE", { exact: true })).toBeVisible();
    await waitForRouting(page);
    await screenshotBoard(page, `${EVIDENCE}/both-light-1440.png`);
  });

  test("dark theme routed Paths stay legible (P-09)", async ({ page }) => {
    await loadOakPark(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Dark mode" }).click();
    await waitForRouting(page);
    await screenshotBoard(page, `${EVIDENCE}/before-dark-1440.png`);
  });

  test("removal restitch stretches then settles (CX-06)", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Write BS&A Software").first().click();
    await page.keyboard.press("Delete");
    const dialog = page.getByRole("dialog", { name: "Remove Node" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Write BS&A Software", exact: true }).click();
    await dialog.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText("Write BS&A Software")).toHaveCount(0);
    await expect(page.getByText("Review BS&A Software").first()).toBeVisible();
    await waitForRouting(page);
    await screenshotBoard(page, `${EVIDENCE}/restitch-1440.png`);
  });

  test("about 30 Nodes and Paths route without hanging (P-03)", async ({ page }) => {
    await page.addInitScript((doc) => {
      localStorage.setItem("automation-pitch.workflow", JSON.stringify(doc));
    }, STRESS);
    await page.goto("/");
    await expect(page.getByText("step 0").first()).toBeVisible({ timeout: 15_000 });
    const started = Date.now();
    await waitForRouting(page);
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
