import { expect, test } from "@playwright/test";
import { DEMO_STEP, capturePage, loadOakPark, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-44-inspector-compact";

function aside(page: import("@playwright/test").Page) {
  return page.locator("aside");
}

async function newBoardWithStep(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("menuitem", { name: "New" }).click();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(page.getByRole("button", { name: "Add Step" })).toBeVisible();
  await page.getByRole("button", { name: "Add Step" }).click();
  await waitForLayout(page);
}

test.describe("Improvement 44 — Human name and compact Name/Details", () => {
  test("Step Name is Type plus underline; Details has no caption", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();

    const name = aside(page).getByLabel("Name");
    const details = aside(page).getByLabel("Details");
    await expect(name).toHaveValue("invoice.pdf");
    await expect(aside(page).locator(".inspector-field-prefix")).toHaveText("Read");
    await expect(aside(page).getByText("Name", { exact: true })).toHaveCount(0);
    await expect(aside(page).getByText("Details", { exact: true })).toHaveCount(0);
    await expect(aside(page).getByText("Step", { exact: true })).toHaveCount(0);
    await expect(aside(page).getByText("Type", { exact: true })).toHaveCount(0);
    await expect(aside(page).getByText("Who", { exact: true })).toHaveCount(0);
    await expect(details).toHaveValue("");

    await capturePage(page, `${EVIDENCE}/step-fields-1440.png`);
    await capturePage(page, ".docs/evidence/improve-44-inspector-labels/step-no-captions-1440.png");
  });

  test("Add human is named Human with no number", async ({ page }) => {
    await newBoardWithStep(page);
    await aside(page).getByRole("button", { name: "Manage actors" }).click();
    await aside(page).getByRole("button", { name: "Add human" }).click();

    await expect(aside(page).getByRole("option", { name: "Human", exact: true })).toBeVisible();
    await expect(aside(page).getByLabel("Name")).toHaveValue("Human");
    await expect(aside(page).getByText(/Person /)).toHaveCount(0);

    await capturePage(page, `${EVIDENCE}/new-human-1440.png`);
  });
});

test.describe("Improvement 44 min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("compact Name/Details still fit at 1024", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    await expect(aside(page).locator(".inspector-field-prefix")).toHaveText("Read");
    await expect(aside(page).getByLabel("Name")).toHaveValue("invoice.pdf");
    await capturePage(page, `${EVIDENCE}/step-fields-1024.png`);
    await capturePage(page, ".docs/evidence/improve-44-inspector-labels/step-no-captions-1024.png");
  });
});
