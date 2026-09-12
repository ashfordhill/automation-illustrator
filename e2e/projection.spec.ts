import { expect, test, type Page } from "@playwright/test";
import { DEMO_STEP, loadOakPark, screenshotBoard, waitForLayout, laneZoom, waitForZoomIdle, enterDarkTheme } from "./ready";

const EVIDENCE = ".docs/evidence/10-projection";
const MAIL_STEP = "Read incoming mail";
const SCAN = "Scan letter to PDF";

function viewLabel(page: Page, name: "Before" | "After" | "Compare") {
  return page.locator("header").getByRole("radio", { name, exact: true });
}

function aside(page: Page) {
  return page.locator("aside");
}

async function loadMailroom(page: Page) {
  await loadOakPark(page);
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("menuitem", { name: "Robot Mailroom" }).click();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(page.getByText(MAIL_STEP).first()).toBeVisible({ timeout: 15_000 });
  await waitForLayout(page);
}

test.describe("slice 10 After projection and comparison", () => {
  test("After matches Before 1:1 (no After-only extras)", async ({ page }) => {
    await loadMailroom(page);
    await expect(page.getByText("delivery receipt")).toHaveCount(0);
    await expect(page.getByText("Recipient").first()).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/before-light-1440.png`);

    await viewLabel(page, "After").click();
    await expect(page.getByRole("radio", { name: "After", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await waitForLayout(page);
    await expect(page.getByText("delivery receipt")).toHaveCount(0);
    await expect(page.locator("[data-merge-group]")).toHaveCount(0);
    await expect(page.getByText(SCAN).first()).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/after-light-1440.png`);

    await enterDarkTheme(page);
    await waitForLayout(page);
    await screenshotBoard(page, `${EVIDENCE}/after-dark-1440.png`);
  });

  test("shared Target edited from After is the same value in Before (BA-02)", async ({ page }) => {
    await loadOakPark(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await page.getByText(DEMO_STEP).first().click();
    const target = aside(page).getByLabel("Name");
    await expect(target).toBeVisible();
    await target.fill("shared after title");
    await target.blur();
    await viewLabel(page, "Before").click();
    await waitForLayout(page);
    await expect(page.getByText("Read shared after title").first()).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/shared-edit-1440.png`);
  });

  test("Compare is read-only and pans the last focused lane (BA-05)", async ({ page }) => {
    await loadOakPark(page);
    await viewLabel(page, "Compare").click();
    await waitForLayout(page);
    await expect(page.getByRole("radio", { name: "Compare", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator('.board-lane[data-lane="before"]')).toBeVisible();
    await expect(page.locator('.board-lane[data-lane="after"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Step or Data" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Remove Node" })).toHaveCount(0);

    await page.getByText(DEMO_STEP).first().click();
    await expect(aside(page).getByLabel("Name")).toBeDisabled();
    await expect(aside(page).getByRole("button", { name: "Who Alice" })).toBeDisabled();

    const afterLane = page.locator('[data-lane="after"]');
    await afterLane.getByText(DEMO_STEP).click();
    await expect(afterLane).toHaveAttribute("data-pan-target", "true");
    await expect(page.locator('[data-lane="before"]')).toHaveAttribute("data-pan-target", "false");
    await screenshotBoard(page, `${EVIDENCE}/both-light-1440.png`);

    await waitForZoomIdle(page);
    const beforeZoom = await laneZoom(page, "before");
    expect(await laneZoom(page, "after")).toBeCloseTo(beforeZoom, 1);
    await afterLane.locator(".react-flow__pane").hover({ position: { x: 200, y: 80 } });
    await page.mouse.wheel(0, -480);
    await expect
      .poll(async () => Math.abs((await laneZoom(page, "before")) - (await laneZoom(page, "after"))), {
        timeout: 3_000,
      })
      .toBeLessThan(0.06);
    expect(await laneZoom(page, "before")).toBeGreaterThan(beforeZoom);
  });

  test("After may remove a Before-origin Step; Before reflects it (BA-04)", async ({ page }) => {
    await loadOakPark(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await page.getByText("Review BS&A Software").first().click();
    await page.getByRole("button", { name: "Remove Review BS&A Software" }).click();
    await expect(page.getByText("Review BS&A Software")).toHaveCount(0);
    await viewLabel(page, "Before").click();
    await waitForLayout(page);
    await expect(page.getByText("Review BS&A Software")).toHaveCount(0);
    await screenshotBoard(page, `${EVIDENCE}/after-origin-removed-1440.png`);
  });

  test("Mailroom has no automation score copy (BA-08 withdrawn)", async ({ page }) => {
    await loadMailroom(page);
    await expect(page.getByText(/will become automated/)).toHaveCount(0);
  });
});

test.describe("supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Mailroom After projection at 1024 CSS pixels", async ({ page }) => {
    await loadMailroom(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await expect(page.getByText(SCAN).first()).toBeVisible();
    await expect(page.getByText("delivery receipt")).toHaveCount(0);
    await screenshotBoard(page, `${EVIDENCE}/after-light-1024.png`);
  });
});
