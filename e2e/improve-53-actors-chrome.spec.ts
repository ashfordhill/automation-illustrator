import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark, waitForLayout, showActorsHome } from "./ready";

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
  test("idle inspector is the Actors roster; Data and Step have no Actors/Back", async ({ page }) => {
    await loadOakPark(page);
    await expect(aside(page).getByRole("button", { name: "Add human" })).toBeVisible();
    await expect(aside(page).getByRole("button", { name: "Actors", exact: true })).toHaveCount(0);
    await expect(aside(page).getByRole("button", { name: "Back" })).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/empty-actors-1440.png`);

    await page.getByText("Account #").first().click();
    await expect(aside(page).getByRole("button", { name: "Remove Data" })).toBeVisible();
    await expect(aside(page).getByRole("button", { name: "Actors", exact: true })).toHaveCount(0);

    await page.getByText("Read invoice.pdf").first().click();
    const who = aside(page).locator(".inspector-who-groups");
    const type = aside(page).locator(".inspector-type-grid");
    const trash = aside(page).getByRole("button", { name: "Remove Step" });
    await expect(who).toBeVisible();
    await expect(type.first()).toBeVisible();
    await expect(aside(page).getByRole("button", { name: "Actors", exact: true })).toHaveCount(0);
    await expect(trash).toBeVisible();
    const whoBox = await who.boundingBox();
    const typeBox = await type.first().boundingBox();
    const trashBox = await trash.boundingBox();
    expect(whoBox && typeBox && trashBox).toBeTruthy();
    expect(typeBox!.y).toBeLessThan(whoBox!.y);
    await capturePage(page, `${EVIDENCE}/step-who-bottom-1440.png`);
  });

  test("Actors roster has no Back; add keys share equal thirds", async ({ page }) => {
    await newBoardWithStep(page);
    await showActorsHome(page);
    await expect(aside(page).getByRole("button", { name: "Back" })).toHaveCount(0);
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

  test("idle Actors roster has no Back", async ({ page }) => {
    await loadOakPark(page);
    await expect(aside(page).getByRole("button", { name: "Add human" })).toBeVisible();
    await expect(aside(page).getByRole("button", { name: "Actors", exact: true })).toHaveCount(0);
    await expect(aside(page).getByRole("button", { name: "Back" })).toHaveCount(0);
    await expect(aside(page).getByLabel("Name")).toBeVisible();
  });
});

test.describe("Improvement 53 min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Actors roster still fits at 1024", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Read invoice.pdf").first().click();
    await showActorsHome(page);
    await expect(aside(page).getByRole("button", { name: "Back" })).toHaveCount(0);
    await expect(aside(page).getByLabel("Name")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/manage-1024.png`);
  });
});
