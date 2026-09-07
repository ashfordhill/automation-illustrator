import { expect, test, type Page } from "@playwright/test";

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
}

function viewLabel(page: Page, name: "Before" | "After" | "Both") {
  return page.locator("header").getByText(name, { exact: true });
}

async function confirmRemove(page: Page, candidateName?: string) {
  const dialog = page.getByRole("dialog", { name: "Remove Node" });
  await expect(dialog).toBeVisible();
  if (candidateName) {
    await dialog.getByRole("button", { name: candidateName, exact: true }).click();
  }
  await dialog.getByRole("button", { name: "Confirm" }).click();
}

test.describe("slice 6 canvas create / connect / remove", () => {
  test("Before / After / Both; After hides +; Pointer/Hand are gone", async ({ page }) => {
    await loadDemo(page);
    await expect(page.getByRole("button", { name: /Undo/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Pointer/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Hand/ })).toHaveCount(0);

    await page.getByText(DEMO_STEP).first().click();
    await expect(page.getByRole("button", { name: "Add Step, Data, or Connect existing" })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/before-light-1440.png`,
      animations: "disabled",
    });

    await page.getByRole("button", { name: "Add Step, Data, or Connect existing" }).click();
    await expect(page.getByRole("menuitem", { name: /Connect existing/ })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/plus-menu-1440.png`,
      animations: "disabled",
    });
    await page.keyboard.press("Escape");

    await viewLabel(page, "After").click();
    await expect(page.getByText("AFTER", { exact: true })).toBeVisible();
    await page.getByText(DEMO_STEP).first().click();
    await expect(page.getByRole("button", { name: "Add Step, Data, or Connect existing" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Remove Node" })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/after-light-1440.png`,
      animations: "disabled",
    });
    await page.screenshot({
      path: `${EVIDENCE}/after-no-plus-1440.png`,
      animations: "disabled",
    });

    await viewLabel(page, "Both").click();
    await expect(page.getByText("BEFORE", { exact: true })).toBeVisible();
    await expect(page.getByText("AFTER", { exact: true })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/both-light-1440.png`,
      animations: "disabled",
    });
  });

  test("leaf, 1:1, N:1, canceled removal, and Backspace undo", async ({ page }) => {
    await loadDemo(page);

    await page.getByText("Review BS&A Software").first().click();
    await page.keyboard.press("Delete");
    await expect(page.getByRole("dialog", { name: "Remove Node" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByText("Review BS&A Software").first()).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/remove-cancel-1440.png`,
      animations: "disabled",
    });

    await page.keyboard.press("Delete");
    await confirmRemove(page);
    await expect(page.getByText("Review BS&A Software")).toHaveCount(0);

    await page.keyboard.press("Backspace");
    await expect(page.getByText("Review BS&A Software").first()).toBeVisible();

    await page.getByText("Write BS&A Software").first().click();
    await page.keyboard.press("Delete");
    await confirmRemove(page, "Write BS&A Software");
    await expect(page.getByText("Write BS&A Software")).toHaveCount(0);
    await expect(page.getByText("Review BS&A Software").first()).toBeVisible();

    await page.getByText("Account #").first().click();
    await page.keyboard.press("Delete");
    await expect(page.getByRole("dialog", { name: "Remove Node" })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/remove-pick-1440.png`,
      animations: "disabled",
    });
    await confirmRemove(page, "Account #");
    await expect(page.getByText("Account #")).toHaveCount(0);
    await expect(page.getByText("Search website").first()).toBeVisible();
    await expect(page.getByText("Review BS&A Software").first()).toBeVisible();
  });

  test("1:N auto restitch after confirm", async ({ page }) => {
    await loadDemo(page);
    await page.getByText("Review BS&A Software").first().click();
    await page.getByRole("button", { name: "Add Step, Data, or Connect existing" }).click();
    await page.getByRole("menuitem", { name: /Step/ }).click();
    await page.getByText("Review BS&A Software").first().click();
    await page.getByRole("button", { name: "Add Step, Data, or Connect existing" }).click();
    await page.getByRole("menuitem", { name: /Step/ }).click();

    await page.getByText("Review BS&A Software").first().click();
    await page.keyboard.press("Delete");
    await confirmRemove(page, "Review BS&A Software");
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
    await expect(page.getByText("Other hub").first()).toBeVisible();

    await page.getByText("Other hub").first().click();
    await page.keyboard.press("Delete");
    await confirmRemove(page, "Other hub");
    await expect(page.getByRole("dialog", { name: "Confirm Node removal pairings" })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/remove-mn-preview-1440.png`,
      animations: "disabled",
    });
    await page.getByRole("dialog", { name: "Confirm Node removal pairings" }).getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText("Other hub")).toHaveCount(0);
    await expect(page.getByText("Other root").first()).toBeVisible();
    await expect(page.getByText("Other out-a").first()).toBeVisible();
  });

  test("blocked root, Path-delete explanation, empty-canvas does not create a Step", async ({
    page,
  }) => {
    await loadDemo(page);
    await page.getByText(DEMO_STEP).first().click();
    await page.keyboard.press("Delete");
    await expect(page.getByText(/root Node cannot be removed/i)).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/root-blocked-1440.png`,
      animations: "disabled",
    });
    await page.keyboard.press("Escape");
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();

    await page.getByText("invoice > $50,000").first().click();
    await page.keyboard.press("Delete");
    await expect(page.getByText(/cannot be removed on its own/i)).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/path-no-delete-1440.png`,
      animations: "disabled",
    });

    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "New" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await page.getByRole("button", { name: "Add Step" }).click();
    await expect(page.locator(".react-flow__node")).toHaveCount(1);
    await page.locator(".react-flow__node").click();
    await page.getByRole("button", { name: "Add Step, Data, or Connect existing" }).click();
    await page.getByRole("menuitem", { name: /Connect existing/ }).click();
    await page.locator(".react-flow__pane").click({ position: { x: 40, y: 40 }, force: true });
    await expect(page.locator(".react-flow__node")).toHaveCount(1);
  });
});

test.describe("supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("demo board is usable at 1024 CSS pixels", async ({ page }) => {
    await loadDemo(page);
    await expect(viewLabel(page, "Before")).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/before-light-1024.png`,
      animations: "disabled",
    });
  });
});
