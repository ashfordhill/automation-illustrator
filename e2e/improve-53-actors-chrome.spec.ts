import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-53-actors-chrome";

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

test.describe("Improvement 53 — Actors chrome under Who", () => {
  test("Type is above Who; Actors sits under the roster, not beside trash", async ({ page }) => {
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
    expect(typeBox!.y).toBeLessThan(whoBox!.y);
    expect(actorsBox!.y).toBeGreaterThan(whoBox!.y + whoBox!.height - 8);
    expect(actorsBox!.x).toBeGreaterThan(whoBox!.x + whoBox!.width / 2);
    expect(await aside(page).locator(".inspector-header #manage-actors-btn").count()).toBe(0);
    await capturePage(page, `${EVIDENCE}/step-who-bottom-1440.png`);
  });

  test("Manage uses Who-key add, trash delete-mode, swatch and eyedropper", async ({ page }) => {
    await newBoardWithStep(page);
    await aside(page).getByRole("button", { name: "Actors", exact: true }).click();
    await expect(aside(page).getByRole("button", { name: "Actors", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(aside(page).getByRole("heading", { name: "Manage actors" })).toHaveCount(0);
    const addHuman = aside(page).getByRole("button", { name: "Add human" });
    const addRobot = aside(page).getByRole("button", { name: "Add robot" });
    const del = aside(page).getByRole("button", { name: "Delete mode" });
    await expect(addHuman).toBeVisible();
    await expect(addRobot).toBeVisible();
    await expect(del).toBeVisible();
    const humanBox = await addHuman.boundingBox();
    const alice = aside(page).getByRole("option", { name: "Alice" });
    const aliceBox = await alice.boundingBox();
    expect(humanBox && aliceBox).toBeTruthy();
    expect(Math.abs(humanBox!.width - aliceBox!.width)).toBeLessThan(4);
    expect(Math.abs(humanBox!.height - aliceBox!.height)).toBeLessThan(8);
    await aside(page).getByRole("option", { name: "Robot LLM" }).click();
    await expect(aside(page).getByLabel("Name")).toHaveValue("Robot");
    await expect(aside(page).getByLabel("Role")).toHaveValue("LLM");
    await expect(aside(page).getByRole("button", { name: "Color" })).toBeVisible();
    await expect(aside(page).getByRole("button", { name: "Eyedropper" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/manage-editor-1440.png`);

    await aside(page).getByRole("button", { name: "Add human" }).click();
    await aside(page).getByRole("button", { name: "Delete mode" }).click();
    await expect(aside(page).getByRole("button", { name: "Delete mode" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(aside(page).getByLabel("Name")).toHaveCount(0);
    await expect(aside(page).locator(".inspector-who-x").first()).toBeVisible();
    await aside(page).getByRole("option", { name: "Human", exact: true }).click();
    await expect(aside(page).getByRole("option", { name: "Human", exact: true })).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/delete-mode-1440.png`);
  });
});

test.describe("Improvement 53 min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Actors under Who still fits at 1024", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Read invoice.pdf").first().click();
    await expect(aside(page).getByRole("button", { name: "Actors", exact: true })).toBeVisible();
    await aside(page).getByRole("button", { name: "Actors", exact: true }).click();
    await expect(aside(page).getByLabel("Name")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/manage-1024.png`);
  });
});
