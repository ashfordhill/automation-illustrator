import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark, pullPlusPreview, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-13-who-inherit";

function aside(page: import("@playwright/test").Page) {
  return page.locator("aside");
}

test.describe("Improvement 13 inherit parent Who", () => {
  test("a child Step created from Roy’s Step is also Roy", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Write BS&A Software").first().click();
    await expect(aside(page).getByRole("button", { name: "Who Alice" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await aside(page).getByRole("button", { name: "Who Roy" }).click();
    await expect(aside(page).getByRole("button", { name: "Who Roy" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.keyboard.press("e");
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
    await page.getByText("Write BS&A Software").first().click();
    await expect(aside(page).getByRole("button", { name: "Who Alice" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.keyboard.press("e");
    await waitForLayout(page);
    await expect(aside(page).getByRole("button", { name: "Who Alice" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await capturePage(page, `${EVIDENCE}/child-keeps-parent-alice-1440.png`);
  });

  test("New board: child of Roy is Roy", async ({ page }) => {
    await loadOakPark(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "New" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByRole("button", { name: "Add Step" })).toBeVisible();
    await page.getByRole("button", { name: "Add Step" }).click();
    await waitForLayout(page);
    await expect(aside(page).getByRole("button", { name: "Who Alice" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await aside(page).getByRole("button", { name: "Who Roy" }).click();
    await expect(aside(page).getByRole("button", { name: "Who Roy" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.keyboard.press("e");
    await waitForLayout(page);
    await expect(aside(page).getByRole("button", { name: "Who Roy" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await capturePage(page, `${EVIDENCE}/new-board-child-roy-1440.png`);
  });

  test("New board: Step off Data under Roy is Roy", async ({ page }) => {
    await loadOakPark(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "New" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await page.getByRole("button", { name: "Add Step" }).click();
    await waitForLayout(page);
    await aside(page).getByRole("button", { name: "Who Roy" }).click();
    await page.keyboard.press("d");
    await waitForLayout(page);
    await page.keyboard.press("e");
    await waitForLayout(page);
    await expect(aside(page).getByRole("button", { name: "Who Roy" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await capturePage(page, `${EVIDENCE}/new-board-data-child-roy-1440.png`);
  });

  test("pulling + onto Step from Roy creates Roy", async ({ page }) => {
    await loadOakPark(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "New" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await page.getByRole("button", { name: "Add Step" }).click();
    await waitForLayout(page);
    await aside(page).getByRole("button", { name: "Who Roy" }).click();
    await pullPlusPreview(page, "New Step");
    await waitForLayout(page);
    await expect(aside(page).getByRole("button", { name: "Who Roy" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await capturePage(page, `${EVIDENCE}/plus-pull-child-roy-1440.png`);
  });
});
