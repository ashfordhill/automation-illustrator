import { expect, test, type Page } from "@playwright/test";
import {
  capturePage,
  enterPresent,
  laneZoom,
  loadOakPark,
  waitForLayout,
  waitForZoomIdle,
} from "./ready";

const EVIDENCE = ".docs/evidence/improve-57-word-web";

const SMALL_YAML = `version: 2
name: Word web small
actors:
  - id: h_alice
    kind: human
    name: Alice
    color: "#ff9fbf"
    role: worker
nodes:
  - id: s_long
    type: step
    position: { x: 32, y: 160 }
    stepKind: other
    title: dfsadfasdfasdfasd
    detail: ""
    split: exclusive
  - id: s_q1
    type: step
    position: { x: 352, y: 32 }
    stepKind: other
    title: ""
    detail: ""
    split: exclusive
  - id: s_q2
    type: step
    position: { x: 352, y: 224 }
    stepKind: other
    title: ""
    detail: ""
    split: exclusive
  - id: s_rev
    type: step
    position: { x: 352, y: 416 }
    stepKind: review
    title: papers
    detail: ""
    split: exclusive
edges:
  - id: e1
    source: s_long
    target: s_q1
    label: ""
    dashed: true
  - id: e2
    source: s_long
    target: s_q2
    label: ""
    dashed: true
  - id: e3
    source: s_long
    target: s_rev
    label: ""
    dashed: true
assignments:
  s_long: h_alice
  s_q1: h_alice
  s_q2: h_alice
  s_rev: h_alice
after:
  assignments: {}
  groups: []
  extraNodes: []
  extraEdges: []
`;

const OAK_HEADLINES = [
  "Read invoice.pdf",
  "Search website",
  "Search filesystem",
  "Write BS&A Software",
  "Review BS&A Software",
  "Review supervisor",
  "Review manager",
];

async function turnOnView(page: Page) {
  const btn = page.getByRole("button", { name: "text-only", exact: true });
  await expect(btn).toBeVisible();
  if ((await btn.getAttribute("aria-pressed")) !== "true") {
    await btn.click();
  }
  await expect(btn).toHaveAttribute("aria-pressed", "true");
  await waitForLayout(page);
  await expect(page.locator(".board-lane").first()).toHaveAttribute("data-web-fit", "true", {
    timeout: 8_000,
  });
  await waitForZoomIdle(page);
}

async function importSmallBoard(page: Page) {
  await page.goto("/");
  await expect(page.getByText("Read invoice.pdf").first()).toBeVisible({ timeout: 15_000 });
  await page.setInputFiles('input[type="file"]', {
    name: "word-web-small.yaml",
    mimeType: "text/yaml",
    buffer: Buffer.from(SMALL_YAML),
  });
  await expect(page.getByRole("dialog", { name: "Import this board?" })).toBeVisible();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(page.getByText("dfsadfasdfasdfasd").first()).toBeVisible({ timeout: 15_000 });
  await waitForLayout(page);
  await waitForZoomIdle(page);
}

function ovalsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

async function expectOvalsReadableAndApart(page: Page, headlines: string[]) {
  const ovals = page.locator(".simplified-oval");
  await expect(ovals.first()).toBeVisible();
  const counts = new Map<string, number>();
  for (const text of headlines) counts.set(text, (counts.get(text) ?? 0) + 1);
  for (const [text, n] of counts) {
    await expect(ovals.filter({ hasText: new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) })).toHaveCount(n);
  }
  const boxes = await ovals.evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      const span = el.querySelector(".simplified-oval-text") ?? el;
      return {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        text: (span.textContent ?? "").trim(),
        clipped: span.scrollWidth > span.clientWidth + 2,
      };
    }),
  );
  for (const b of boxes) {
    expect(b.clipped, `${b.text} is clipped`).toBe(false);
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      expect(ovalsOverlap(boxes[i]!, boxes[j]!), `${boxes[i]!.text} overlaps ${boxes[j]!.text}`).toBe(
        false,
      );
    }
  }
}

test.describe("Improvement 57 — word-web layout", () => {
  test("small board fills the pane with large ovals", async ({ page }) => {
    await importSmallBoard(page);
    await turnOnView(page);
    await expect(page.locator(".board-lane").first()).toHaveAttribute("data-layout-mode", "web");
    await expect(page.locator(".board-lane").first()).toHaveAttribute("data-simplified", "true");
    await expect(page.getByRole("button", { name: "text-only", exact: true })).toHaveClass(/is-on/);
    await expectOvalsReadableAndApart(page, ["dfsadfasdfasdfasd", "?", "?", "Review papers"]);
    await expect(page.locator(".react-flow__edge").first()).toBeAttached();
    await expect(page.locator(".path-condition")).toHaveCount(0);
    const first = (await page.locator(".simplified-oval").first().boundingBox())!;
    expect(first.width).toBeGreaterThan(160);
    expect(first.height).toBeGreaterThan(48);
    await capturePage(page, `${EVIDENCE}/web-small-board-1440.png`);
  });

  test("Oak Park fits the full web; Data ovals stay; leave restores tiles", async ({ page }) => {
    await loadOakPark(page);
    await waitForZoomIdle(page);
    const tileZoom = await laneZoom(page);

    await turnOnView(page);
    await expect(page.locator(".board-lane").first()).toHaveAttribute("data-layout-mode", "web");
    await expectOvalsReadableAndApart(page, OAK_HEADLINES);
    await expect(page.locator(".path-condition")).toHaveCount(0);
    await expect(page.locator(".react-flow__edge").first()).toBeAttached();
    await expect(page.locator('[data-simplified-tile="data"]').first()).toBeVisible();
    await expect(page.locator(".simplified-oval", { hasText: "Account #" }).first()).toBeVisible();
    await expect(page.locator(".is-display-hop")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/web-oak-park-1440.png`);
    await capturePage(page, `${EVIDENCE}/web-hide-data-1440.png`);

    const view = page.getByRole("button", { name: "text-only", exact: true });
    await view.click();
    await expect(view).toHaveAttribute("aria-pressed", "false");
    await waitForLayout(page);
    await waitForZoomIdle(page);
    await expect(page.locator(".board-lane").first()).toHaveAttribute("data-simplified", "false");
    await expect(page.locator(".board-lane").first()).toHaveAttribute("data-layout-mode", "tile");
    await expect(page.locator(".actor-strip").first()).toBeVisible();
    await expect(page.locator(".simplified-oval")).toHaveCount(0);
    expect(Math.abs((await laneZoom(page)) - tileZoom)).toBeLessThan(0.08);
    await capturePage(page, `${EVIDENCE}/web-leave-tiles-1440.png`);
  });

  test("tile zoom-out has slack past fit but does not become an island", async ({ page }) => {
    await loadOakPark(page);
    await waitForZoomIdle(page);
    await expect(page.locator(".board-lane").first()).toHaveAttribute("data-simplified", "false");
    const fitted = await laneZoom(page);
    expect(fitted).toBeGreaterThan(0.2);
    expect(fitted).toBeLessThan(1);

    await page.mouse.move(720, 420);
    for (let i = 0; i < 40; i++) {
      await page.mouse.wheel(0, 120);
    }
    await waitForZoomIdle(page);
    const after = await laneZoom(page);
    expect(after).toBeLessThan(fitted - 0.02);
    expect(after).toBeGreaterThanOrEqual(fitted * 0.72 - 0.03);
    expect(after).toBeGreaterThan(0.24);
    const pane = await page.locator(".board-lane .react-flow").first().boundingBox();
    const nodes = await page.locator(".board-lane .react-flow__nodes").first().boundingBox();
    expect(pane && nodes).toBeTruthy();
    expect(nodes!.width).toBeGreaterThan(pane!.width * 0.22);
    await expect(page.locator(".actor-strip").first()).toBeVisible();
    await expect(page.locator(".simplified-oval")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/tile-zoom-floor-1440.png`);
  });

  test("Present keeps the word-web", async ({ page }) => {
    await loadOakPark(page);
    await turnOnView(page);
    await expect(page.locator(".simplified-oval").first()).toBeVisible();

    await enterPresent(page);
    await expect(page.locator("footer.status-bar")).toHaveCount(0);
    await expect(page.locator(".board-lane").first()).toHaveAttribute("data-simplified", "true");
    await expect(page.locator(".simplified-oval", { hasText: "Read invoice.pdf" }).first()).toBeVisible();
  });
});

test.describe("Improvement 57 at 1024", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("word-web fits the min width", async ({ page }) => {
    await loadOakPark(page);
    await turnOnView(page);
    await expect(page.locator(".simplified-oval", { hasText: "Read invoice.pdf" })).toBeVisible();
    await expectOvalsReadableAndApart(page, ["Read invoice.pdf", "Write BS&A Software"]);
    await capturePage(page, `${EVIDENCE}/web-1024.png`);
  });
});
