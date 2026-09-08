import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-13-who-inherit";

function aside(page: import("@playwright/test").Page) {
  return page.locator("aside");
}

test.describe("Improvement 13 inherit parent Who", () => {
  test("a child Step created from Roy’s Step is also Roy", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Review BS&A Software").first().click();
    await expect(aside(page).getByRole("button", { name: "Who Alice" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await aside(page).getByRole("button", { name: "Who Roy" }).click();
    await expect(aside(page).getByRole("button", { name: "Who Roy" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.keyboard.press("1");
    await waitForLayout(page);
    await expect(aside(page).getByRole("button", { name: "Who Roy" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await capturePage(page, `${EVIDENCE}/child-inherits-roy-1440.png`);
  });

  test("a child of Alice stays Alice even if last-used Who is Roy", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Read invoice.pdf").first().click();
    await aside(page).getByRole("button", { name: "Who Roy" }).click();
    await page.getByText("Review BS&A Software").first().click();
    await expect(aside(page).getByRole("button", { name: "Who Alice" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.keyboard.press("1");
    await waitForLayout(page);
    await expect(aside(page).getByRole("button", { name: "Who Alice" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await capturePage(page, `${EVIDENCE}/child-keeps-parent-alice-1440.png`);
  });
});
