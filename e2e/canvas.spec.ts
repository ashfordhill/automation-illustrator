import { expect, test, type Page } from "@playwright/test";
import { waitForLayout, laneZoom, waitForZoomIdle, capturePage, tabPeekPoint } from "./ready";

const DEMO_STEP = "Read invoice.pdf";
const EVIDENCE = ".docs/evidence/06-canvas";

const MN_DOC = {
  version: 2,
  actors: [{ id: "h1", kind: "human", name: "Ada", color: "#f4c6d4", role: "worker" }],
  nodes: [
    { id: "r", type: "step", position: { x: 32, y: 160 }, stepKind: "other", title: "root", detail: "", split: "exclusive" },
    { id: "a", type: "step", position: { x: 320, y: 32 }, stepKind: "other", title: "left", detail: "", split: "exclusive" },
    { id: "b", type: "step", position: { x: 320, y: 288 }, stepKind: "other", title: "right", detail: "", split: "exclusive" },
    { id: "n", type: "step", position: { x: 608, y: 160 }, stepKind: "other", title: "hub", detail: "", split: "exclusive" },
    { id: "c", type: "step", position: { x: 896, y: 32 }, stepKind: "other", title: "out-a", detail: "", split: "exclusive" },
    { id: "d", type: "step", position: { x: 896, y: 288 }, stepKind: "other", title: "out-b", detail: "", split: "exclusive" },
  ],
  edges: [
    { id: "e1", source: "r", target: "a", label: "" },
    { id: "e2", source: "r", target: "b", label: "" },
    { id: "e3", source: "a", target: "n", label: "" },
    { id: "e4", source: "b", target: "n", label: "" },
    { id: "e5", source: "n", target: "c", label: "" },
    { id: "e6", source: "n", target: "d", label: "" },
  ],
  assignments: { r: "h1", a: "h1", b: "h1", n: "h1", c: "h1", d: "h1" },
  after: { assignments: {}, groups: [], extraNodes: [], extraEdges: [] },
};

async function loadDemo(page: Page) {
  await page.goto("/");
  await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
  await waitForLayout(page);
}

function viewLabel(page: Page, name: "Before" | "After" | "Both") {
  return page.locator("header").getByText(name, { exact: true });
}

test.describe("slice 6 canvas create / connect / remove", () => {
  test("Before / After / Both; After hides +; Pointer/Hand are gone", async ({ page }) => {
    await loadDemo(page);
    await expect(page.getByRole("button", { name: /Undo/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Pointer/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Hand/ })).toHaveCount(0);

    await expect(page.getByRole("button", { name: "Add Step or Data" })).toHaveCount(0);
    await page.getByText(DEMO_STEP).first().hover();
    await expect(page.getByRole("button", { name: "Add Step or Data" })).toHaveCount(0);
    await page.getByText(DEMO_STEP).first().click();
    await expect(page.getByRole("button", { name: "Add Step or Data" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pull a Path to an existing Node" })).toBeVisible();
    await expect(page.getByRole("button", { name: `Remove ${DEMO_STEP}` })).toBeVisible();
    await expect(page.getByRole("button", { name: "Remove Node" })).toHaveCount(0);
    await expect(page.locator(".remove-candidate, .remove-candidate-on")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/before-light-1440.png`);
    await capturePage(page, ".docs/evidence/improve-02-merge-drag/selected-x-1440.png");
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
    await expect(page.locator('[data-plus-preview="data"] ellipse')).toBeVisible();
    await expect(page.locator("[data-plus-taffy]")).toBeVisible();
    await expect(page.locator("[data-plus-wedge]")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/plus-menu-1440.png`);
    await capturePage(page, ".docs/evidence/improve-02-merge-drag/plus-pull-previews-1440.png");
    await page.mouse.up();
    await page.keyboard.press("Escape");

    await page.getByText(DEMO_STEP).first().click();
    const knot = page.getByRole("button", { name: "Pull a Path to an existing Node" });
    const knotBox = await knot.boundingBox();
    expect(knotBox).toBeTruthy();
    const knotGrab = tabPeekPoint(knotBox!);
    await page.mouse.move(knotGrab.x, knotGrab.y);
    await page.mouse.down();
    await page.mouse.move(knotGrab.x + 90, knotGrab.y + 20, {
      steps: 10,
    });
    await capturePage(page, ".docs/evidence/improve-02-merge-drag/path-knot-pull-1440.png");
    await page.mouse.up();
    await page.keyboard.press("Escape");

    await viewLabel(page, "After").click();
    await expect(page.getByRole("radio", { name: "After", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await page.getByText(DEMO_STEP).first().click();
    await expect(page.getByRole("button", { name: "Add After-only Step" })).toBeVisible();
    await expect(page.getByRole("button", { name: `Remove ${DEMO_STEP}` })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/after-light-1440.png`);
    const afterPlus = page.getByRole("button", { name: "Add After-only Step" });
    const afterBox = await afterPlus.boundingBox();
    expect(afterBox).toBeTruthy();
    const afterGrab = tabPeekPoint(afterBox!);
    await page.mouse.move(afterGrab.x, afterGrab.y);
    await page.mouse.down();
    await page.mouse.move(afterGrab.x + 140, afterGrab.y, {
      steps: 12,
    });
    await expect(page.getByRole("button", { name: "After-only Step" })).toBeVisible();
    await expect(page.getByRole("button", { name: "New Data" })).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/after-no-plus-1440.png`);
    await page.mouse.up();
    await page.keyboard.press("Escape");

    await viewLabel(page, "Both").click();
    await expect(page.getByRole("radio", { name: "Both", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator('.board-lane[data-lane="before"]')).toBeVisible();
    await expect(page.locator('.board-lane[data-lane="after"]')).toBeVisible();
    await capturePage(page, `${EVIDENCE}/both-light-1440.png`);
  });

  test("leaf, 1:1, N:1, canceled removal, and Backspace undo", async ({ page }) => {
    await loadDemo(page);

    await page.getByText("Review BS&A Software").first().click();
    await expect(page.getByRole("button", { name: "Remove Review BS&A Software" })).toBeVisible();
    await page.locator(".react-flow__pane").click({ position: { x: 24, y: 24 }, force: true });
    await expect(page.getByText("Review BS&A Software").first()).toBeVisible();
    await capturePage(page, `${EVIDENCE}/remove-cancel-1440.png`);

    await page.getByText("Review BS&A Software").first().click();
    await page.keyboard.press("Delete");
    await expect(page.getByText("Review BS&A Software")).toHaveCount(0);

    await page.keyboard.press("Backspace");
    await expect(page.getByText("Review BS&A Software").first()).toBeVisible();

    await page.getByText("Write BS&A Software").first().click();
    await page.keyboard.press("Delete");
    await expect(page.getByText("Write BS&A Software")).toHaveCount(0);
    await expect(page.getByText("Review BS&A Software").first()).toBeVisible();

    await page.getByText("Account #").first().click();
    await expect(page.getByRole("button", { name: "Remove Account #" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/remove-pick-1440.png`);
    await page.keyboard.press("Delete");
    await expect(page.getByText("Account #")).toHaveCount(0);
    await expect(page.getByText("Search website").first()).toBeVisible();
    await expect(page.getByText("Review BS&A Software").first()).toBeVisible();
  });

  test("1:N auto restitch after confirm", async ({ page }) => {
    await loadDemo(page);
    await page.getByText("Review BS&A Software").first().click();
    await page.keyboard.press("1");
    await page.getByText("Review BS&A Software").first().click();
    await page.keyboard.press("1");

    await page.getByText("Review BS&A Software").first().click();
    await page.keyboard.press("Delete");
    await expect(page.getByText("Review BS&A Software")).toHaveCount(0);
    await expect(page.getByText("Write BS&A Software").first()).toBeVisible();
  });

  test("many-to-many preview is adjustable then applied atomically", async ({ page }) => {
    await loadDemo(page);
    await page.getByRole("button", { name: "Menu" }).click();
    const [chooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.getByRole("menuitem", { name: "Import" }).click(),
    ]);
    await chooser.setFiles({
      name: "mn.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(MN_DOC)),
    });
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText("hub").first()).toBeVisible();

    await page.getByText("hub").first().click();
    await page.keyboard.press("Delete");
    await expect(page.getByRole("dialog", { name: "Confirm Node removal pairings" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/remove-mn-preview-1440.png`);
    await page.getByRole("dialog", { name: "Confirm Node removal pairings" }).getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText("hub")).toHaveCount(0);
    await expect(page.getByText("root").first()).toBeVisible();
    await expect(page.getByText("out-a").first()).toBeVisible();
  });

  test("blocked root, Path-delete explanation, empty-canvas does not create a Step", async ({
    page,
  }) => {
    await loadDemo(page);
    await page.getByText(DEMO_STEP).first().click();
    await page.keyboard.press("Delete");
    await expect(page.getByText("The root cannot be removed while other Tiles remain.")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/root-blocked-1440.png`);
    await page.keyboard.press("Escape");
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();

    await page.getByText("invoice > $50,000").first().click();
    await page.keyboard.press("Delete");
    await expect(page.getByText(/cannot be removed on its own/i)).toBeVisible();
    await capturePage(page, `${EVIDENCE}/path-no-delete-1440.png`);

    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "New" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await page.getByRole("button", { name: "Add Step" }).click();
    await expect(page.locator(".react-flow__node")).toHaveCount(1);
    await page.locator(".react-flow__node").click();
    await expect(page.getByRole("button", { name: "Add Step or Data" })).toBeVisible();
    const pathTab = page.getByRole("button", { name: "Pull a Path to an existing Node" });
    const tabBox = await pathTab.boundingBox();
    expect(tabBox).toBeTruthy();
    const pathGrab = tabPeekPoint(tabBox!);
    await page.mouse.move(pathGrab.x, pathGrab.y);
    await page.mouse.down();
    await page.mouse.move(40, 40, { steps: 10 });
    await page.mouse.up();
    await expect(page.locator(".react-flow__node")).toHaveCount(1);
  });

  test("Data tile is a centered oval; Mailroom Dana Who card hugs the role", async ({ page }) => {
    await loadDemo(page);
    await page.getByText(DEMO_STEP).first().click();
    await page.keyboard.press("2");
    await waitForLayout(page);
    await expect(page.getByText("Data", { exact: true }).first()).toBeVisible();
    await page.getByText("Data", { exact: true }).first().click();
    await capturePage(page, ".docs/evidence/improve-03-polish/data-centered-1440.png");

    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Robot Mailroom" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText("Read incoming mail").first()).toBeVisible({ timeout: 15_000 });
    await waitForLayout(page);
    await capturePage(page, ".docs/evidence/improve-03-polish/dana-card-1440.png");
  });
});

test.describe("viewport stays user-driven", () => {
  test("clicking a tile does not change zoom, and the wheel has several stops", async ({ page }) => {
    await loadDemo(page);
    await waitForZoomIdle(page);
    const beforeClick = await laneZoom(page);
    await page.getByText(DEMO_STEP).first().click();
    await expect(page.getByRole("button", { name: "Add Step or Data" })).toBeVisible();
    expect(await laneZoom(page)).toBeCloseTo(beforeClick, 2);

    const samples = new Set<string>();
    samples.add((await laneZoom(page)).toFixed(2));
    await page.mouse.move(480, 420);
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, -120);
      samples.add((await laneZoom(page)).toFixed(2));
    }
    expect(samples.size).toBeGreaterThanOrEqual(4);
    expect(await laneZoom(page)).toBeGreaterThan(beforeClick);
  });
});

test.describe("supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("demo board is usable at 1024 CSS pixels", async ({ page }) => {
    await loadDemo(page);
    await expect(viewLabel(page, "Before")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/before-light-1024.png`);
  });
});
