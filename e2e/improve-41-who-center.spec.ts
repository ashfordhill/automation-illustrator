import { expect, test, type Locator, type Page } from "@playwright/test";
import { DEMO_STEP, capturePage, loadOakPark } from "./ready";

const EVIDENCE = ".docs/evidence/improve-41-who-center";

function aside(page: Page) {
  return page.locator("aside");
}

/** First and last Human keys are equally inset from a full-width rail control. */
async function assertKeysCenteredOn(cluster: Locator, reference: Locator) {
  const humans = cluster.locator('[aria-label="Humans"] .inspector-who');
  const first = humans.first();
  const last = humans.last();
  const refBox = await reference.boundingBox();
  const firstBox = await first.boundingBox();
  const lastBox = await last.boundingBox();
  expect(refBox && firstBox && lastBox).toBeTruthy();
  const left = firstBox!.x - refBox!.x;
  const right = refBox!.x + refBox!.width - (lastBox!.x + lastBox!.width);
  expect(Math.abs(left - right)).toBeLessThan(16);
  expect(lastBox!.x + lastBox!.width - firstBox!.x).toBeLessThan(refBox!.width - 8);
}

async function assertColumnsLineUp(cluster: Locator) {
  const firstHuman = cluster.locator('[aria-label="Humans"] .inspector-who').first();
  const firstRobot = cluster.locator('[aria-label="Robots"] .inspector-who').first();
  const humanBox = await firstHuman.boundingBox();
  const robotBox = await firstRobot.boundingBox();
  expect(humanBox && robotBox).toBeTruthy();
  expect(Math.abs(humanBox!.x - robotBox!.x)).toBeLessThan(8);
}

test.describe("Improvement 41 — center Who keys", () => {
  test("Who cluster is centered; columns still line up", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    const cluster = aside(page).locator(".inspector-who-groups");
    await expect(cluster).toBeVisible();
    await assertKeysCenteredOn(
      cluster,
      aside(page).getByRole("button", { name: "Manage actors" }),
    );
    await assertColumnsLineUp(cluster);
    await capturePage(page, `${EVIDENCE}/who-center-1440.png`);
  });

  test("Manage actors cluster is centered too", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    await aside(page).getByRole("button", { name: "Manage actors" }).click();
    const cluster = aside(page).locator(".inspector-who-groups");
    await expect(cluster).toBeVisible();
    await assertKeysCenteredOn(cluster, aside(page).locator(".inspector-manage"));
    await assertColumnsLineUp(cluster);
    await capturePage(page, `${EVIDENCE}/manage-center-1440.png`);
  });
});

test.describe("Improvement 41 — min width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Who cluster stays centered at 1024", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    const cluster = aside(page).locator(".inspector-who-groups");
    await assertKeysCenteredOn(
      cluster,
      aside(page).getByRole("button", { name: "Manage actors" }),
    );
    await capturePage(page, `${EVIDENCE}/who-center-1024.png`);
  });
});
