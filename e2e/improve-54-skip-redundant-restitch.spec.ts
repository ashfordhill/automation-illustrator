import { expect, test, type Locator, type Page } from "@playwright/test";
import { capturePage, tabPeekPoint, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-54-skip-redundant-restitch";

async function newBoard(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("menuitem", { name: "New" }).click();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(page.getByRole("button", { name: "Add Step" })).toBeVisible();
}

async function nodesByX(page: Page) {
  return page.locator(".react-flow__node").evaluateAll((els) =>
    els
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { id: el.getAttribute("data-id") ?? "", x: r.x, y: r.y };
      })
      .sort((a, b) => a.x - b.x || a.y - b.y),
  );
}

async function pullPathOnto(page: Page, from: Locator, targetId: string) {
  const pathTab = from.getByRole("button", { name: "Pull a Path to an existing Node" });
  await expect(pathTab).toBeVisible();
  const tabBox = await pathTab.boundingBox();
  if (!tabBox) throw new Error("Path tab has no box");
  const grab = tabPeekPoint(tabBox);
  await page.mouse.move(grab.x, grab.y);
  await page.mouse.down();
  const target = page.locator(`.react-flow__node[data-id="${targetId}"]`);
  const box = await target.boundingBox();
  if (!box) throw new Error("Path-pull target has no box");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 16 });
  await page.mouse.up();
  await waitForLayout(page);
}

async function buildDiamond(page: Page) {
  await newBoard(page);
  await page.getByRole("button", { name: "Add Step" }).click();
  await waitForLayout(page);
  await page.keyboard.press("e");
  await waitForLayout(page);
  await page.keyboard.press("e");
  await waitForLayout(page);
  const chain = await nodesByX(page);
  expect(chain).toHaveLength(3);
  await page.getByRole("button", { name: "Hide inspector" }).click();
  await expect(page.getByRole("button", { name: "Show inspector" })).toBeVisible();
  await page.locator(`.react-flow__node[data-id="${chain[0]!.id}"]`).click();
  await page.keyboard.press("d");
  await waitForLayout(page);
  const data = page.locator('.react-flow__node[data-id^="d_"]');
  await expect(data).toHaveCount(1);
  await data.click();
  await pullPathOnto(page, data, chain[2]!.id);
  await expect(page.locator(".react-flow__edge")).toHaveCount(4);
  return { leftId: chain[0]!.id, midId: chain[1]!.id, rightId: chain[2]!.id };
}

test.describe("Improvement 54 — skip redundant restitch", () => {
  test("deleting the middle Alice keeps Data’s route and does not add a shortcut Path", async ({
    page,
  }) => {
    const { midId, leftId, rightId } = await buildDiamond(page);
    await expect(page.locator(".react-flow__node")).toHaveCount(4);
    await capturePage(page, `${EVIDENCE}/diamond-before-1440.png`);

    await page.locator(`.react-flow__node[data-id="${midId}"]`).click();
    await page.keyboard.press("Delete");
    await waitForLayout(page);

    await expect(page.locator(".react-flow__node")).toHaveCount(3);
    await expect(page.locator(`.react-flow__node[data-id="${midId}"]`)).toHaveCount(0);
    await expect(page.locator(".react-flow__edge")).toHaveCount(2);
    await expect(page.locator(`.react-flow__node[data-id="${leftId}"]`)).toHaveCount(1);
    await expect(page.locator(`.react-flow__node[data-id="${rightId}"]`)).toHaveCount(1);
    await expect(page.locator('.react-flow__node[data-id^="d_"]')).toHaveCount(1);
    await capturePage(page, `${EVIDENCE}/diamond-deleted-1440.png`);
  });
});

test.describe("Improvement 54 — min width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("deleting the middle Alice still skips the leftover Path at 1024", async ({ page }) => {
    const { midId } = await buildDiamond(page);
    await page.locator(`.react-flow__node[data-id="${midId}"]`).click();
    await page.keyboard.press("Delete");
    await waitForLayout(page);
    await expect(page.locator(".react-flow__node")).toHaveCount(3);
    await expect(page.locator(".react-flow__edge")).toHaveCount(2);
    await capturePage(page, `${EVIDENCE}/diamond-deleted-1024.png`);
  });
});
