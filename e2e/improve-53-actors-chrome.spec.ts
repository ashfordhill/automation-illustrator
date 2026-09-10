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

test.describe("Improvement 53 — Actors header text and headshot add", () => {
  test("empty inspector has Actors; Data does not; Step puts it beside trash", async ({ page }) => {
    await loadOakPark(page);
    const actors = aside(page).getByRole("button", { name: "Actors", exact: true });
    await expect(actors).toBeVisible();
    await expect(aside(page).locator(".inspector-header #manage-actors-btn")).toHaveCount(1);
    await capturePage(page, `${EVIDENCE}/empty-actors-1440.png`);

    await page.getByText("Account #").first().click();
    await expect(aside(page).getByRole("button", { name: "Remove Data" })).toBeVisible();
    await expect(actors).toHaveCount(0);

    await page.getByText("Read invoice.pdf").first().click();
    const who = aside(page).locator(".inspector-who-groups");
    const type = aside(page).locator(".inspector-type-grid");
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
    expect(actorsBox!.y).toBeLessThan(whoBox!.y);
    expect(Math.abs(actorsBox!.y - trashBox!.y)).toBeLessThan(8);
    expect(actorsBox!.x).toBeLessThan(trashBox!.x);
    await capturePage(page, `${EVIDENCE}/step-who-bottom-1440.png`);
  });

  test("Manage from a Step shows Back; add keys share equal thirds", async ({ page }) => {
    await newBoardWithStep(page);
    await aside(page).getByRole("button", { name: "Actors", exact: true }).click();
    await expect(aside(page).getByRole("button", { name: "Back" })).toBeVisible();
    await expect(aside(page).getByRole("button", { name: "Actors", exact: true })).toHaveCount(0);
    await expect(aside(page).getByRole("button", { name: "Remove Step" })).toHaveCount(0);
    await expect(aside(page).getByRole("heading", { name: "Manage actors" })).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/manage-from-step-back-1440.png`);

    const alice = aside(page).getByRole("option", { name: "Alice", exact: true });
    const aliceBefore = await alice.boundingBox();
    expect(aliceBefore).toBeTruthy();

    const addHuman = aside(page).getByRole("button", { name: "Add human" });
    const addRobot = aside(page).getByRole("button", { name: "Add robot" });
    const del = aside(page).getByRole("button", { name: "Delete mode" });
    await expect(addHuman).toBeVisible();
    await expect(addRobot).toBeVisible();
    await expect(del).toBeVisible();
    const humanBox = await addHuman.boundingBox();
    const robotBox = await addRobot.boundingBox();
    const delBox = await del.boundingBox();
    expect(humanBox && robotBox && delBox).toBeTruthy();
    expect(Math.abs(humanBox!.width - robotBox!.width)).toBeLessThan(4);
    expect(Math.abs(robotBox!.width - delBox!.width)).toBeLessThan(4);
    expect(Math.abs(humanBox!.height - humanBox!.width)).toBeLessThan(8);
    expect(Math.abs(humanBox!.y - delBox!.y)).toBeLessThan(4);
    await aside(page).getByRole("option", { name: "Robot LLM" }).click();
    await expect(aside(page).getByLabel("Name")).toHaveValue("Robot");
    await expect(aside(page).getByLabel("Role")).toHaveValue("LLM");
    await expect(aside(page).getByRole("button", { name: "Color" })).toBeVisible();
    await expect(aside(page).getByRole("button", { name: "Eyedropper" })).toBeVisible();
    const nameBox = await aside(page).getByLabel("Name").boundingBox();
    const roleBox = await aside(page).getByLabel("Role").boundingBox();
    const colorBox = await aside(page).getByRole("button", { name: "Color" }).boundingBox();
    const dropBox = await aside(page).getByRole("button", { name: "Eyedropper" }).boundingBox();
    expect(nameBox && roleBox && colorBox && dropBox).toBeTruthy();
    expect(colorBox!.x).toBeGreaterThan(nameBox!.x + nameBox!.width - 2);
    expect(dropBox!.y).toBeGreaterThan(colorBox!.y + 8);
    expect(roleBox!.y).toBeGreaterThan(nameBox!.y + nameBox!.height - 2);
    await capturePage(page, `${EVIDENCE}/manage-editor-1440.png`);

    await addHuman.click();
    const aliceAfter = await alice.boundingBox();
    const newHuman = aside(page).getByRole("option", { name: "Human", exact: true });
    const newHumanBox = await newHuman.boundingBox();
    expect(aliceAfter && newHumanBox).toBeTruthy();
    expect(Math.abs(aliceAfter!.x - aliceBefore!.x)).toBeLessThan(2);
    expect(Math.abs(aliceAfter!.y - aliceBefore!.y)).toBeLessThan(2);
    expect(newHumanBox!.y).toBeGreaterThan(aliceAfter!.y + aliceAfter!.height - 2);
    await capturePage(page, `${EVIDENCE}/manage-wrap-stable-1440.png`);

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

  test("Manage from empty keeps Actors and hides Back", async ({ page }) => {
    await loadOakPark(page);
    await aside(page).getByRole("button", { name: "Actors", exact: true }).click();
    await expect(aside(page).getByRole("button", { name: "Actors", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(aside(page).getByRole("button", { name: "Back" })).toHaveCount(0);
    await expect(aside(page).getByLabel("Name")).toBeVisible();
  });
});

test.describe("Improvement 53 min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("header Actors and headshot add still fit at 1024", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Read invoice.pdf").first().click();
    await expect(aside(page).getByRole("button", { name: "Actors", exact: true })).toBeVisible();
    await aside(page).getByRole("button", { name: "Actors", exact: true }).click();
    await expect(aside(page).getByRole("button", { name: "Back" })).toBeVisible();
    await expect(aside(page).getByLabel("Name")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/manage-1024.png`);
  });
});
