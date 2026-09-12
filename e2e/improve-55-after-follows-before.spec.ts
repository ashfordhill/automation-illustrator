import { expect, test, type Page } from "@playwright/test";
import {
  capturePage,
  laneCamera,
  loadOakPark,
  waitForLayout,
  waitForZoomIdle,
} from "./ready";

const EVIDENCE = ".docs/evidence/improve-55-after-follows-before";

function viewLabel(page: Page, name: "Before" | "After" | "Compare") {
  return page.locator("header").getByRole("radio", { name, exact: true });
}

async function panBoard(page: Page, dx: number, dy: number) {
  const pane = page.locator(".board-lane .react-flow__pane").first();
  const box = await pane.boundingBox();
  expect(box).toBeTruthy();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 10 });
  await page.mouse.up();
}

test.describe("Improvement 55 — After camera follows Before", () => {
  test("After opens on the same pan and zoom as Before", async ({ page }) => {
    await loadOakPark(page);
    await waitForZoomIdle(page);

    await panBoard(page, -180, -90);
    await page.mouse.move(480, 420);
    await page.mouse.wheel(0, -360);
    await waitForZoomIdle(page);

    const beforeCam = await laneCamera(page, "before");
    expect(beforeCam.zoom).toBeGreaterThan(0.2);
    await capturePage(page, `${EVIDENCE}/before-panned-1440.png`);

    await viewLabel(page, "After").click();
    await expect(page.getByRole("radio", { name: "After", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await waitForLayout(page);
    await waitForZoomIdle(page);

    const afterCam = await laneCamera(page, "after");
    expect(afterCam.zoom).toBeCloseTo(beforeCam.zoom, 2);
    expect(Math.abs(afterCam.x - beforeCam.x)).toBeLessThan(3);
    expect(Math.abs(afterCam.y - beforeCam.y)).toBeLessThan(3);
    await capturePage(page, `${EVIDENCE}/after-follows-1440.png`);
  });
});

test.describe("Improvement 55 After follows Before at 1024", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("After matches Before's camera at the supported min width", async ({ page }) => {
    await loadOakPark(page);
    await waitForZoomIdle(page);
    await panBoard(page, -120, 70);
    await waitForZoomIdle(page);
    const beforeCam = await laneCamera(page, "before");

    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await waitForZoomIdle(page);
    const afterCam = await laneCamera(page, "after");
    expect(afterCam.zoom).toBeCloseTo(beforeCam.zoom, 2);
    expect(Math.abs(afterCam.x - beforeCam.x)).toBeLessThan(3);
    expect(Math.abs(afterCam.y - beforeCam.y)).toBeLessThan(3);
    await capturePage(page, `${EVIDENCE}/after-follows-1024.png`);
  });
});
