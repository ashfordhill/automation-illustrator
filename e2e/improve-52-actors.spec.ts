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
  test("Who is above Type; Actors sits next to trash", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Read invoice.pdf").first().click();
    const who = aside(page).locator(".inspector-who-groups");
    const type = aside(page).locator(".inspector-type-grid");
    const actors = aside(page).getByRole("button", { name: "Actors", exact: true });
    const trash = aside(page).getByRole("button", { name: "Remove Step" });
    await expect(who).toBeVisible();
    await expect(type.first()).toBeVisible();
    await expect(actors).toBeVisible();
    await expect(trash).toBeVisible();
    const whoBox = await who.boundingBox();
    const typeBox = await type.first().boundingBox();
    const actorsBox = await actors.boundingBox();
    const trashBox = await trash.boundingBox();
    expect(whoBox && typeBox && actorsBox && trashBox).toBeTruthy();
    expect(whoBox!.y).toBeLessThan(typeBox!.y);
    expect(actorsBox!.width).toBeGreaterThan(trashBox!.width * 1.4);
    expect(Math.abs(actorsBox!.height - trashBox!.height)).toBeLessThan(8);
    await capturePage(page, `${EVIDENCE}/step-who-first-1440.png`);
  });

  test("Manage uses icon add, Role, and minus delete-mode", async ({ page }) => {
    await newBoardWithStep(page);
    await aside(page).getByRole("button", { name: "Actors", exact: true }).click();
    await expect(aside(page).getByRole("button", { name: "Actors", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
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
