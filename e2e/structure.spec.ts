import { expect, test, type Page } from "@playwright/test";
import { waitForRouting } from "./ready";

const DEMO_STEP = "Read invoice.pdf";
const EVIDENCE = ".docs/evidence/02-structure";

async function loadDemo(page: Page) {
  await page.goto("/");
  await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
  await waitForRouting(page);
}

function viewLabel(page: Page, name: "Before" | "After" | "Both") {
  return page.locator("header").getByText(name, { exact: true });
}

test.describe("slice 2 structure evidence", () => {
  test("Before / After / Both and hamburger match the Slice 1 harness states", async ({
    page,
  }) => {
    await loadDemo(page);
    await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/before-light-1440.png`,
      animations: "disabled",
    });

    await viewLabel(page, "After").click();
    await expect(page.getByText("AFTER", { exact: true })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/after-light-1440.png`,
      animations: "disabled",
    });

    await viewLabel(page, "Both").click();
    await expect(page.getByText("BEFORE", { exact: true })).toBeVisible();
    await expect(page.getByText("AFTER", { exact: true })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/both-light-1440.png`,
      animations: "disabled",
    });

    await viewLabel(page, "Before").click();
    await page.getByRole("button", { name: "Menu" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "Present" })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/hamburger-keyboard-1440.png`,
      animations: "disabled",
    });
  });
});

test.describe("supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("demo board is usable at 1024 CSS pixels", async ({ page }) => {
    await loadDemo(page);
    await expect(viewLabel(page, "Before")).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/before-light-1024.png`,
      animations: "disabled",
    });
  });
});
