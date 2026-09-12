import { expect, test } from "@playwright/test";
import {
  capturePage,
  enterPresent,
  laneZoom,
  loadOakPark,
  waitForLayout,
  waitForZoomIdle,
} from "./ready";

const EVIDENCE = ".docs/evidence/improve-56-simplify";

async function turnOnView(page: import("@playwright/test").Page) {
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

test.describe("Improvement 56 — View word-web", () => {
  test("View is a press-toggle; on is a word-web of ovals", async ({ page }) => {
    await loadOakPark(page);
    await waitForZoomIdle(page);

    await expect(page.locator(".board-lane").first()).toHaveAttribute("data-simplified", "false");
    await expect(page.locator(".actor-strip").first()).toBeVisible();
    const view = page.getByRole("button", { name: "text-only", exact: true });
    await expect(view).toBeVisible();
    await expect(view).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("button", { name: "Simplify" })).toHaveCount(0);
    await expect(page.getByRole("menuitemcheckbox", { name: "Hide visuals", exact: true })).toHaveCount(0);
    await expect(page.getByRole("menuitemcheckbox", { name: "Hide data", exact: true })).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/menu-open-1440.png`);
    await capturePage(page, ".docs/evidence/improve-60-view-toggle/view-idle-1440.png");

    await turnOnView(page);

    await expect(view).toHaveClass(/is-on/);
    await expect(page.locator(".board-lane").first()).toHaveAttribute("data-simplified", "true");
    await expect(page.locator(".simplified-oval").first()).toBeVisible();
    await expect(page.locator(".actor-strip")).toHaveCount(0);
    const oval = page.locator(".simplified-oval", { hasText: "Read invoice.pdf" }).first();
    await expect(oval).toBeVisible();
    await expect(oval).toHaveText("Read invoice.pdf");
    await expect(page.locator(".path-condition")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/zoom-out-lod-1440.png`);
    await capturePage(page, ".docs/evidence/improve-60-view-toggle/view-on-1440.png");
  });

  test("View stays on at zoom 1; Data ovals stay; Paths stay lines", async ({ page }) => {
    await loadOakPark(page);
    await waitForZoomIdle(page);

    await turnOnView(page);

    await page.mouse.move(480, 420);
    for (let i = 0; i < 32; i++) {
      if ((await laneZoom(page)) >= 0.9) break;
      await page.mouse.wheel(0, -120);
    }
    await waitForZoomIdle(page);
    expect(await laneZoom(page)).toBeGreaterThan(0.62);

    await expect(page.locator(".board-lane").first()).toHaveAttribute("data-simplified", "true");
    await expect(page.locator(".board-lane").first()).not.toHaveAttribute("data-simplify-hide-data");
    await expect(page.locator(".simplified-oval").first()).toBeVisible();
    await expect(page.locator('[data-simplified-tile="data"]').first()).toBeVisible();
    await expect(page.locator(".simplified-oval", { hasText: "Account #" }).first()).toBeVisible();
    await expect(page.locator(".is-display-hop")).toHaveCount(0);
    await expect(page.locator("[data-simplify-arrow]")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/always-hide-data-1440.png`);
  });

  test("Present hides the status bar and keeps View prefs", async ({ page }) => {
    await loadOakPark(page);
    await turnOnView(page);
    await enterPresent(page);
    await expect(page.locator("footer.status-bar")).toHaveCount(0);
    await expect(page.locator(".board-lane").first()).toHaveAttribute("data-simplified", "true");
    await capturePage(page, `${EVIDENCE}/present-lod-1440.png`);
  });
});

test.describe("Improvement 56 at 1024", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("View toggle and word-web fit the min width", async ({ page }) => {
    await loadOakPark(page);
    await turnOnView(page);
    await expect(page.locator(".simplified-oval").first()).toBeVisible();
    await capturePage(page, `${EVIDENCE}/simplify-1024.png`);
    await capturePage(page, ".docs/evidence/improve-60-view-toggle/view-1024.png");
  });
});
