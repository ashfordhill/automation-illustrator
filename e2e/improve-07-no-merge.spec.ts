import { expect, test, type Page } from "@playwright/test";
import { loadOakPark, screenshotBoard, waitForLayout, capturePage } from "./ready";

const EVIDENCE = ".docs/evidence/improve-07-no-merge";
const MAIL_STEP = "Read incoming mail";
const RECEIPT = "Email delivery receipt to sender";
const SCAN = "Scan letter to PDF";

function viewLabel(page: Page, name: "Before" | "After" | "Compare") {
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

test.describe("Improvement 07 — merge groups withdrawn", () => {
  test("Mailroom After has no merge dock or After-only extras", async ({
    page,
  }) => {
    await loadMailroom(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await expect(page.getByText(RECEIPT)).toHaveCount(0);
    await expect(page.getByText(SCAN).first()).toBeVisible();
    await expect(page.locator("[data-merge-group]")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Merge and Unmerge" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Unmerge" })).toHaveCount(0);
    await screenshotBoard(page, `${EVIDENCE}/mailroom-after-no-merge-1440.png`);
  });

  test("After inspector on a Before-origin Step has no Unmerge", async ({ page }) => {
    await loadMailroom(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await page.getByText(SCAN).first().click();
    await expect(page.locator("aside").getByRole("button", { name: "Unmerge" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Unmerge" })).toHaveCount(0);
    await screenshotBoard(page, `${EVIDENCE}/after-inspector-no-unmerge-1440.png`);
  });

  test("Keybinds catalog has no Merge or Unmerge", async ({ page }) => {
    await loadOakPark(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Keybinds" }).click();
    const dialog = page.getByRole("dialog", { name: "Keybinds" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Merge", { exact: true })).toHaveCount(0);
    await expect(dialog.getByText("Unmerge", { exact: true })).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/keybinds-no-merge-1440.png`);
  });

  test("Before-origin X in After removes the Step with no Unmerge offer (BA-04)", async ({ page }) => {
    await loadMailroom(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await page.getByText(SCAN).first().click();
    await page.getByRole("button", { name: `Remove ${SCAN}` }).click();
    await expect(page.getByText(SCAN)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Unmerge" })).toHaveCount(0);
  });
});
