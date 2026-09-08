import { expect, test, type Page } from "@playwright/test";
import { loadOakPark, screenshotBoard, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/11-merge";
const MAIL_STEP = "Read incoming mail";
const RECEIPT = "Email delivery receipt to sender";
const SCAN = "Scan letter to PDF";

function viewLabel(page: Page, name: "Before" | "After" | "Both") {
  return page.locator("header").getByText(name, { exact: true });
}

async function loadMailroom(page: Page) {
  await loadOakPark(page);
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("menuitem", { name: "Robot Mailroom" }).click();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(page.getByText(MAIL_STEP).first()).toBeVisible({ timeout: 15_000 });
  await waitForLayout(page);
}

test.describe("slice 11 merge / unmerge and After-only Steps", () => {
  test("Mailroom After shows the giant Step internals, receipt, and merge dock", async ({ page }) => {
    await loadMailroom(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await expect(page.getByText(RECEIPT).first()).toBeVisible();
    await expect(page.locator("[data-merge-group]").first()).toBeVisible();
    await expect(page.getByText(SCAN).first()).toBeVisible();
    await expect(page.getByText("Recipient").first()).toBeVisible();
    await expect(page.getByRole("region", { name: "Merge and Unmerge" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Merge", exact: true })).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/after-mailroom-1440.png`);
    await screenshotBoard(page, ".docs/evidence/improve-02-merge-drag/mailroom-after-1440.png");
  });

  test("After + offers After-only Step, not Data", async ({ page }) => {
    await loadOakPark(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await page.getByText("Read invoice.pdf").first().click();
    const afterPlus = page.getByRole("button", { name: "Add After-only Step" });
    const box = await afterPlus.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2 + 140, box!.y + box!.height / 2, { steps: 12 });
    await expect(page.getByRole("button", { name: "After-only Step" })).toBeVisible();
    await expect(page.getByRole("button", { name: "New Data" })).toHaveCount(0);
    await screenshotBoard(page, `${EVIDENCE}/after-plus-1440.png`);
    await page.mouse.up();
    await page.keyboard.press("Escape");
  });

  test("Merge preview then Unmerge restores Mailroom members", async ({ page }) => {
    await loadMailroom(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await page.locator("[data-merge-group]").first().click();
    await expect(page.getByRole("button", { name: "Unmerge" }).first()).toBeVisible();
    await page.getByRole("region", { name: "Merge and Unmerge" }).getByRole("button", { name: "Unmerge" }).click();
    await waitForLayout(page);
    await expect(page.locator("[data-merge-group]")).toHaveCount(0);
    await expect(page.getByText(SCAN).first()).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/after-unmerged-1440.png`);

    await page.getByText(SCAN).first().click();
    await page.getByRole("region", { name: "Merge and Unmerge" }).getByRole("button", { name: "Merge", exact: true }).click();
    await expect(page.getByText("Merge these Steps?")).toBeVisible();
    await page.getByText("Search staff directory").first().click();
    await page.getByRole("button", { name: "Confirm" }).click();
    await waitForLayout(page);
    await expect(page.locator("[data-merge-group]").first()).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/after-remerged-1440.png`);
  });

  test("After-only Step can be added and removed", async ({ page }) => {
    await loadOakPark(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await page.getByText("Read invoice.pdf").first().click();
    await page.keyboard.press("1");
    await waitForLayout(page);
    await expect(page.locator("aside").getByRole("button", { name: "Type Other" })).toBeVisible();
    await page.locator("aside").getByRole("button", { name: "Remove Step" }).click();
    await waitForLayout(page);
    await expect(page.locator("aside").getByRole("button", { name: "Manage actors" })).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/after-only-removed-1440.png`);
  });

  test("disconnected merge selection explains", async ({ page }) => {
    await loadMailroom(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await page.locator("[data-merge-group]").first().click();
    await page.getByRole("region", { name: "Merge and Unmerge" }).getByRole("button", { name: "Unmerge" }).click();
    await waitForLayout(page);
    await page.getByText("Email PDF to recipient").first().click();
    await page.getByRole("region", { name: "Merge and Unmerge" }).getByRole("button", { name: "Merge", exact: true }).click();
    await page.getByText("Call sender for details").first().click();
    await expect(page.getByText("Those Steps are not connected by base Paths.")).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/merge-rejected-1440.png`);
  });

  test("Present, Before, and Both hide the merge dock (MG-01, P-07, BA-05)", async ({ page }) => {
    await loadMailroom(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await expect(page.getByRole("region", { name: "Merge and Unmerge" })).toBeVisible();

    await viewLabel(page, "Before").click();
    await expect(page.getByRole("region", { name: "Merge and Unmerge" })).toHaveCount(0);

    await viewLabel(page, "Both").click();
    await waitForLayout(page);
    await expect(page.getByRole("region", { name: "Merge and Unmerge" })).toHaveCount(0);

    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Present" }).click();
    await expect(page.getByRole("region", { name: "Merge and Unmerge" })).toHaveCount(0);
    await screenshotBoard(page, `${EVIDENCE}/present-hides-dock-1440.png`);
  });
});

test.describe("supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Mailroom After merge tile at 1024 CSS pixels", async ({ page }) => {
    await loadMailroom(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await expect(page.locator("[data-merge-group]").first()).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/after-mailroom-1024.png`);
  });
});

test.describe("dark theme", () => {
  test("Mailroom After merge tile in dark theme", async ({ page }) => {
    await loadMailroom(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Dark mode" }).click();
    await waitForLayout(page);
    await screenshotBoard(page, `${EVIDENCE}/after-mailroom-dark-1440.png`);
  });
});
