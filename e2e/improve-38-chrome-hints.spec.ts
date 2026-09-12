import { expect, test } from "@playwright/test";
import { DEMO_STEP, capturePage, loadOakPark, pathScreenPoint } from "./ready";

const EVIDENCE = ".docs/evidence/improve-38-chrome-hints";

test.describe("Improvement 38 — chrome, hints, Type, Who", () => {
  test("X is centered; tabs sit off the tile; spawn hints are two lines", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Search filesystem").first().click();
    const tile = page.locator(".tile-chrome-host.is-selected .step-piece");
    const xBtn = page.getByRole("button", { name: /Remove Search filesystem/ });
    await expect(xBtn).toBeVisible();
    const tileBox = await tile.boundingBox();
    const xBox = await xBtn.boundingBox();
    expect(tileBox && xBox).toBeTruthy();
    const tileCx = tileBox!.x + tileBox!.width / 2;
    const xCx = xBox!.x + xBox!.width / 2;
    expect(Math.abs(xCx - tileCx)).toBeLessThan(3);

    const spawn = page.locator("[data-spawn-hints]");
    await expect(spawn.locator(".canvas-helper-spawn-kind-step")).toHaveText("step");
    await expect(spawn.locator(".canvas-helper-spawn-kind-data")).toHaveText("data");
    await expect(page.locator(".canvas-helper")).not.toContainText("Right-click");
    await capturePage(page, `${EVIDENCE}/step-chrome-hints-1440.png`);
  });

  test("Data X is centered and the mark is the lighter purple", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Account #").first().click();
    const tile = page.locator(".tile-chrome-host.is-selected .field-piece");
    const xBtn = page.getByRole("button", { name: /Remove Account #/ });
    await expect(xBtn).toBeVisible();
    const tileBox = await tile.boundingBox();
    const xBox = await xBtn.boundingBox();
    expect(tileBox && xBox).toBeTruthy();
    const tileCx = tileBox!.x + tileBox!.width / 2;
    const xCx = xBox!.x + xBox!.width / 2;
    expect(Math.abs(xCx - tileCx)).toBeLessThan(3);
    const fill = await page.locator(".field-piece ellipse").first().evaluate((el) => getComputedStyle(el).fill);
    expect(fill).toBe("rgb(174, 120, 242)");
    await capturePage(page, `${EVIDENCE}/data-chrome-1440.png`);
  });

  test("Type names are not clipped; Who selected is yellow without a 4px ink frame", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    const review = page.locator("aside").getByRole("button", { name: "Type Review" });
    await expect(review).toBeVisible();
    const name = review.locator(".inspector-type-name");
    await expect(name).toHaveText("Review");
    const clipped = await name.evaluate((el) => el.scrollHeight - el.clientHeight > 1);
    expect(clipped).toBe(false);

    const alice = page.locator("aside").getByRole("button", { name: "Who Alice" });
    await expect(alice).toHaveCSS("background-color", "rgb(232, 193, 74)");
    await expect(alice).toHaveCSS("border-top-color", "rgb(232, 193, 74)");
    await expect(alice).toHaveCSS("border-top-width", "2px");

    const other = page.locator("aside").getByRole("button", { name: "Type Other" });
    const call = page.locator("aside").getByRole("button", { name: "Type Call" });
    const otherBox = await other.boundingBox();
    const callBox = await call.boundingBox();
    expect(otherBox && callBox).toBeTruthy();
    expect(otherBox!.width).toBeLessThan((callBox!.width ?? 0) * 1.5);
    await capturePage(page, `${EVIDENCE}/type-who-1440.png`);
  });

  test("Manage actors selects the Step’s Who; Path hints always show Right-click delete", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Search filesystem").first().click();
    await page.locator("aside").getByRole("button", { name: "Actors", exact: true }).click();
    const alice = page.locator("aside").getByRole("option", { name: "Alice" });
    await expect(alice).toHaveAttribute("aria-selected", "true");
    await capturePage(page, `${EVIDENCE}/manage-alice-1440.png`);
    await page.locator("aside").getByRole("button", { name: "Back" }).click();

    const pt = await pathScreenPoint(page, "e_web_acct", 0.22);
    await page.mouse.click(pt.x, pt.y);
    await expect(page.locator(".canvas-helper")).toContainText("Right-click");
    await expect(page.locator(".canvas-helper [data-mouse-right-click]")).toBeVisible();
    await expect(page.locator(".canvas-helper")).toContainText("Edit text");
    await capturePage(page, `${EVIDENCE}/path-hint-toggle-on-1440.png`);
  });
});

test.describe("Improvement 38 — min width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("spawn hints and Type keypad still fit at 1024", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    await expect(page.locator("[data-spawn-hints] .canvas-helper-spawn-kind-step")).toHaveText("step");
    await expect(page.locator("aside").getByRole("button", { name: "Type Review" })).toHaveText(/Review/);
    await capturePage(page, `${EVIDENCE}/chrome-hints-1024.png`);
  });
});
