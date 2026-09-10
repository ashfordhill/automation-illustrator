import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-52-actors";

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

test.describe("Improvement 52 — Actors header and Manage polish", () => {
  test("Actors toggle still opens Manage with Role and Color", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Read invoice.pdf").first().click();
    const actors = aside(page).getByRole("button", { name: "Actors", exact: true });
    await expect(actors).toBeVisible();
    await actors.click();
    await expect(aside(page).getByRole("button", { name: "Back" })).toBeVisible();
    await expect(aside(page).getByRole("heading", { name: "Manage actors" })).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/step-who-first-1440.png`);
  });

  test("Manage uses icon add, Role, and minus delete-mode", async ({ page }) => {
    await newBoardWithStep(page);
    await aside(page).getByRole("button", { name: "Actors", exact: true }).click();
    await expect(aside(page).getByRole("button", { name: "Back" })).toBeVisible();
    await expect(aside(page).getByRole("heading", { name: "Manage actors" })).toHaveCount(0);
    await expect(aside(page).getByRole("button", { name: "Add human" })).toBeVisible();
    await expect(aside(page).getByRole("button", { name: "Add robot" })).toBeVisible();
    await expect(aside(page).getByRole("button", { name: "Delete mode" })).toBeVisible();
    await aside(page).getByRole("option", { name: "Robot LLM" }).click();
    await expect(aside(page).getByLabel("Name")).toHaveValue("Robot");
    await expect(aside(page).getByLabel("Role")).toHaveValue("LLM");
    await expect(aside(page).getByRole("button", { name: "Color" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/manage-editor-1440.png`);

    await aside(page).getByRole("button", { name: "Add human" }).click();
    await aside(page).getByRole("button", { name: "Delete mode" }).click();
    await expect(aside(page).getByRole("button", { name: "Delete mode" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(aside(page).getByLabel("Name")).toHaveCount(0);
    await aside(page).getByRole("option", { name: "Human", exact: true }).click();
    await expect(aside(page).getByRole("option", { name: "Human", exact: true })).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/delete-mode-1440.png`);
  });
});

test.describe("Improvement 52 min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Actors header still fits at 1024", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Read invoice.pdf").first().click();
    await expect(aside(page).getByRole("button", { name: "Actors", exact: true })).toBeVisible();
    await aside(page).getByRole("button", { name: "Actors", exact: true }).click();
    await expect(aside(page).getByLabel("Name")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/manage-1024.png`);
  });
});
