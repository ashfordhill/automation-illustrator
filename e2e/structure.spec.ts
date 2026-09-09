import { expect, test, type Page } from "@playwright/test";
import { waitForLayout, capturePage } from "./ready";

const DEMO_STEP = "Read invoice.pdf";
const EVIDENCE = ".docs/evidence/02-structure";

async function loadDemo(page: Page) {
  await page.goto("/");
  await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
  await waitForLayout(page);
}

function viewLabel(page: Page, name: "Before" | "After" | "Compare") {
  return page.locator("header").getByText(name, { exact: true });
}

test.describe("slice 2 structure evidence", () => {
  test("Before / After / Both and hamburger match the Slice 1 harness states", async ({
    page,
  }) => {
    await loadDemo(page);
    await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/before-light-1440.png`);

    await viewLabel(page, "After").click();
    await expect(page.getByRole("radio", { name: "After", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await capturePage(page, `${EVIDENCE}/after-light-1440.png`);

    await viewLabel(page, "Compare").click();
    await expect(page.getByRole("radio", { name: "Compare", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator('.board-lane[data-lane="before"]')).toBeVisible();
    await expect(page.locator('.board-lane[data-lane="after"]')).toBeVisible();
    await capturePage(page, `${EVIDENCE}/both-light-1440.png`);

    await viewLabel(page, "Before").click();
    await page.getByRole("button", { name: "Menu" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "New" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Present" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/hamburger-keyboard-1440.png`);
  });
});

test.describe("supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("demo board is usable at 1024 CSS pixels", async ({ page }) => {
    await loadDemo(page);
    await expect(viewLabel(page, "Before")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/before-light-1024.png`);
  });
});
