import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { capturePage, loadOakPark, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-21-status-bar";

test.describe("Improvement 21 — bottom status bar", () => {
  test("full-width bar overlaps the inspector with project, Actors, toggle, and version", async ({
    page,
  }) => {
    await loadOakPark(page);
    const bar = page.locator("footer.status-bar");
    await expect(bar).toBeVisible();
    await expect(bar.getByText("Oak Park Invoice")).toBeVisible();
    await expect(page.getByRole("button", { name: "Actors", exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "right-click-delete: off" }),
    ).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByLabel("Application version 1.0.0")).toHaveText("v1.0.0");

    const barBox = await bar.boundingBox();
    const asideBox = await page.locator("aside").boundingBox();
    expect(barBox).toBeTruthy();
    expect(asideBox).toBeTruthy();
    expect(barBox!.x).toBeLessThanOrEqual(1);
    expect(barBox!.x + barBox!.width).toBeGreaterThan(asideBox!.x + 8);
    expect(barBox!.y + barBox!.height).toBeGreaterThanOrEqual(asideBox!.y + asideBox!.height - 2);
    expect(barBox!.y).toBeLessThan(asideBox!.y + asideBox!.height);

    await capturePage(page, `${EVIDENCE}/oak-park-1440.png`);
    const axe = await new AxeBuilder({ page })
      .include("footer.status-bar")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      axe.violations.map((v) => ({
        id: v.id,
        help: v.help,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  });

  test("New is Untitled; Actors opens Manage actors; Mailroom keeps its name", async ({
    page,
  }) => {
    await loadOakPark(page);
    await page.getByRole("button", { name: "Actors", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Manage actors" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/actors-1440.png`);

    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "New" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.locator("footer.status-bar").getByText("Untitled")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/untitled-1440.png`);

    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Robot Mailroom" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText("incoming mail").first()).toBeVisible({ timeout: 15_000 });
    await waitForLayout(page);
    await expect(page.locator("footer.status-bar").getByText("Robot Mailroom")).toBeVisible();
  });

  test("right-click-delete on removes a Tile; off does not", async ({ page }) => {
    await loadOakPark(page);
    const review = page.getByText("Review BS&A Software").first();
    await review.click({ button: "right" });
    await expect(review).toBeVisible();
    await expect(page.getByTestId("path-menu-delete")).toHaveCount(0);

    await page.getByRole("button", { name: "right-click-delete: off" }).click();
    await expect(
      page.getByRole("button", { name: "right-click-delete: on" }),
    ).toHaveAttribute("aria-pressed", "true");
    await capturePage(page, `${EVIDENCE}/right-click-on-1440.png`);

    await review.click({ button: "right" });
    await expect(page.getByText("Review BS&A Software")).toHaveCount(0);
    await waitForLayout(page);
  });

  test("dark theme status bar stays chunky chrome", async ({ page }) => {
    await loadOakPark(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Dark mode" }).click();
    await expect(page.locator("footer.status-bar")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/dark-1440.png`);
  });
});

test.describe("Improvement 21 status bar at 1024", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("bar still spans into the inspector at min width", async ({ page }) => {
    await loadOakPark(page);
    const barBox = await page.locator("footer.status-bar").boundingBox();
    const asideBox = await page.locator("aside").boundingBox();
    expect(barBox).toBeTruthy();
    expect(asideBox).toBeTruthy();
    expect(barBox!.x + barBox!.width).toBeGreaterThan(asideBox!.x + 8);
    await capturePage(page, `${EVIDENCE}/status-bar-1024.png`);
  });
});

