import { expect, test } from "@playwright/test";
import { loadOakPark, screenshotBoard, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-16-other-task";

function aside(page: import("@playwright/test").Page) {
  return page.locator("aside");
}

test.describe("Improvement 16 Other clipboard (Name no longer Task)", () => {
  test("Add Step leaves Name empty and does not print Other", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "New" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await page.getByRole("button", { name: "Add Step" }).click();
    await waitForLayout(page);
    await expect(aside(page).locator("#step-name-field")).toHaveValue("");
    await expect(page.getByText("Other Task")).toHaveCount(0);
    await expect(aside(page).getByRole("button", { name: "Type Other" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await screenshotBoard(page, `${EVIDENCE}/new-other-task-1440.png`);
  });

  test("a child Step has empty Name; Type Other keeps a Name that was already typed", async ({
    page,
  }) => {
    await loadOakPark(page);
    await page.getByText("Review BS&A Software").first().click();
    await page.keyboard.press("e");
    await waitForLayout(page);
    await expect(aside(page).locator("#step-name-field")).toHaveValue("");
    await screenshotBoard(page, `${EVIDENCE}/child-other-task-1440.png`);

    await page.getByText("Read invoice.pdf").first().click();
    await aside(page).getByRole("button", { name: "Type Other" }).click();
    await expect(aside(page).locator("#step-name-field")).toHaveValue("invoice.pdf");
    await expect(page.getByText("Other invoice.pdf")).toHaveCount(0);
  });
});
