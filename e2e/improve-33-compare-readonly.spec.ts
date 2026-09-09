import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark, waitForLayout, enterDarkTheme } from "./ready";

const EVIDENCE = ".docs/evidence/improve-33-compare-readonly";
const DEMO_STEP = "Read invoice.pdf";

function viewRadio(page: import("@playwright/test").Page, name: "Before" | "After" | "Compare") {
  return page.getByRole("radio", { name, exact: true });
}

function aside(page: import("@playwright/test").Page) {
  return page.locator("aside");
}

test.describe("Improvement 33 — Compare greys Who and fields", () => {
  test("Type, Who, and text fields share the disabled look", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    await viewRadio(page, "Compare").click();
    await waitForLayout(page);

    const typeOn = aside(page).getByRole("button", { name: "Type Read" });
    const whoOn = aside(page).getByRole("button", { name: "Who Alice" });
    const name = aside(page).locator("#step-name-field");
    const details = aside(page).locator("#step-details-field");

    await expect(typeOn).toBeDisabled();
    await expect(whoOn).toBeDisabled();
    await expect(name).toBeDisabled();
    await expect(details).toBeDisabled();
    await expect(typeOn).toHaveCSS("opacity", "0.55");
    await expect(whoOn).toHaveCSS("opacity", "0.55");
    await expect(aside(page).locator(".inspector-field").first()).toHaveCSS("opacity", "0.55");
    await expect(aside(page).locator(".inspector-field").nth(1)).toHaveCSS("opacity", "0.55");
    await expect(aside(page).getByRole("button", { name: "Manage actors" })).toHaveCount(0);

    await capturePage(page, `${EVIDENCE}/compare-step-1440.png`);

    await enterDarkTheme(page);
    await waitForLayout(page);
    await capturePage(page, `${EVIDENCE}/compare-step-dark-1440.png`);
  });
});

test.describe("supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Compare inspector stays greyed at 1024", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    await viewRadio(page, "Compare").click();
    await waitForLayout(page);
    await expect(aside(page).getByRole("button", { name: "Who Alice" })).toBeDisabled();
    await expect(aside(page).locator("#step-name-field")).toBeDisabled();
    await capturePage(page, `${EVIDENCE}/compare-step-1024.png`);
  });
});
