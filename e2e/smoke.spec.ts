import { expect, test, type Page } from "@playwright/test";
import { expectAxeClean } from "./axe";
import { waitForLayout, capturePage } from "./ready";

const DEMO_STEP = "Read invoice.pdf";

async function loadDemo(page: Page) {
  await page.goto("/");
  await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
  await waitForLayout(page);
}

/** Mantine hides the radio inputs; the visible labels live in the header. */
function viewLabel(page: Page, name: "Before" | "After" | "Compare") {
  return page.locator("header").getByText(name, { exact: true });
}

test.describe("baseline smoke", () => {
  test("app mounts with the Oak Park demo", async ({ page }) => {
    await loadDemo(page);
    await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Manage actors" })).toBeVisible();
    await capturePage(page, ".docs/evidence/01-harness/before-light-1440.png");
  });

  test("Before / After / Compare view switching", async ({ page }) => {
    await loadDemo(page);
    await viewLabel(page, "After").click();
    await expect(page.getByRole("radio", { name: "After", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();
    await waitForLayout(page);
    await capturePage(page, ".docs/evidence/01-harness/after-light-1440.png");

    await viewLabel(page, "Compare").click();
    await expect(page.getByRole("radio", { name: "Compare", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator('.board-lane[data-lane="before"]')).toBeVisible();
    await expect(page.locator('.board-lane[data-lane="after"]')).toBeVisible();
    await waitForLayout(page);
    await capturePage(page, ".docs/evidence/01-harness/both-light-1440.png");

    await viewLabel(page, "Before").click();
    await expect(page.getByRole("radio", { name: "Before", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  test("top bar is reachable from the keyboard", async ({ page }) => {
    await loadDemo(page);
    await page.keyboard.press("Tab");
    const inHeader = await page.evaluate(() => {
      const el = document.activeElement;
      return !!el && !!el.closest("header");
    });
    expect(inHeader).toBe(true);

    await page.getByRole("button", { name: "Menu" }).focus();
    await expect(page.getByRole("button", { name: "Menu" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "New" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Present" })).toBeVisible();
    await capturePage(page, ".docs/evidence/01-harness/hamburger-keyboard-1440.png");
  });

  test("axe WCAG 2.2 AA on the initial demo state", async ({ page }) => {
    await loadDemo(page);
    await expectAxeClean(page);
  });
});

test.describe("supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("demo board is usable at 1024 CSS pixels", async ({ page }) => {
    await loadDemo(page);
    await expect(viewLabel(page, "Before")).toBeVisible();
    await capturePage(page, ".docs/evidence/01-harness/before-light-1024.png");
  });
});
