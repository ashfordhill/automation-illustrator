import { expect, test, type Page } from "@playwright/test";
import { capturePage, loadOakPark, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-59-board-ready";

function viewRadio(page: Page, name: "Before" | "After" | "Compare") {
  return page.getByRole("radio", { name, exact: true });
}

test.describe("Improvement 59 — first layout cover", () => {
  test("refresh reveals the board ready; first After click stays ready", async ({ page }) => {
    await loadOakPark(page);
    const lane = page.locator(".board-lane").first();
    await expect(lane).toHaveAttribute("data-board", "ready");
    await expect(lane).toHaveAttribute("data-layout", "ready");
    await expect(page.getByRole("status", { name: "Loading..." })).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/before-ready-1440.png`);

    await viewRadio(page, "After").click();
    await expect(viewRadio(page, "After")).toHaveAttribute("aria-checked", "true");
    await expect(lane).toHaveAttribute("data-board", "ready");
    await expect(page.getByRole("status", { name: "Loading..." })).toHaveCount(0);
    await waitForLayout(page);
    await capturePage(page, `${EVIDENCE}/after-ready-1440.png`);
  });
});

test.describe("Improvement 59 at 1024", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("first After click at min width stays ready", async ({ page }) => {
    await loadOakPark(page);
    await viewRadio(page, "After").click();
    await waitForLayout(page);
    await expect(page.locator(".board-lane").first()).toHaveAttribute("data-board", "ready");
    await capturePage(page, `${EVIDENCE}/after-ready-1024.png`);
  });
});
