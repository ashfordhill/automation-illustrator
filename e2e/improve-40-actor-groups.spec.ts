import { expect, test } from "@playwright/test";
import { capturePage, waitForLayout, showActorsHome } from "./ready";

const EVIDENCE = ".docs/evidence/improve-40-actor-groups";

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

test.describe("Improvement 40 — Humans then Robots on their own row", () => {
  test("Add human sits with Humans; Robots start on the next row", async ({ page }) => {
    await newBoardWithStep(page);
    await showActorsHome(page);
    await aside(page).getByRole("button", { name: "Add human" }).click();

    const options = aside(page).getByRole("option");
    await expect(options).toHaveCount(8);
    await expect(options.nth(0)).toHaveAttribute("aria-label", "Alice");
    await expect(options.nth(4)).toHaveAttribute("aria-label", "Human");
    await expect(options.nth(5)).toHaveAttribute("aria-label", "Robot LLM");
    await expect(options.nth(7)).toHaveAttribute("aria-label", "Robot Agent");

    const person = options.nth(4);
    const llm = aside(page).getByRole("option", { name: "Robot LLM", exact: true });
    const personBox = await person.boundingBox();
    const llmBox = await llm.boundingBox();
    expect(personBox && llmBox).toBeTruthy();
    expect(llmBox!.y).toBeGreaterThan(personBox!.y + personBox!.height - 2);
    expect(Math.abs(llmBox!.x - personBox!.x)).toBeLessThan(8);

    await capturePage(page, `${EVIDENCE}/manage-human-row-1440.png`);

    await aside(page).getByRole("button", { name: "Add robot" }).click();
    await expect(aside(page).getByRole("option")).toHaveCount(9);
    await expect(aside(page).getByRole("option").nth(8)).toHaveAttribute(
      "aria-label",
      "Robot Script",
    );
    await capturePage(page, `${EVIDENCE}/manage-robot-end-1440.png`);
  });

  test("Who picker also keeps Robots on their own row", async ({ page }) => {
    await newBoardWithStep(page);
    await showActorsHome(page);
    await aside(page).getByRole("button", { name: "Add human" }).click();
    await page.locator(".react-flow__node").first().click();

    const person = aside(page).getByRole("button", { name: "Who Human" });
    const llm = aside(page).getByRole("button", { name: "Who Robot LLM" });
    await expect(person).toBeVisible();
    const personBox = await person.boundingBox();
    const llmBox = await llm.boundingBox();
    expect(personBox && llmBox).toBeTruthy();
    expect(llmBox!.y).toBeGreaterThan(personBox!.y + personBox!.height - 2);
    await capturePage(page, `${EVIDENCE}/who-human-row-1440.png`);
  });
});

test.describe("Improvement 40 min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Robots still start on a new row at 1024", async ({ page }) => {
    await newBoardWithStep(page);
    await showActorsHome(page);
    await aside(page).getByRole("button", { name: "Add human" }).click();
    const person = aside(page).getByRole("option").nth(4);
    const llm = aside(page).getByRole("option", { name: "Robot LLM", exact: true });
    const personBox = await person.boundingBox();
    const llmBox = await llm.boundingBox();
    expect(personBox && llmBox).toBeTruthy();
    expect(llmBox!.y).toBeGreaterThan(personBox!.y + personBox!.height - 2);
    await capturePage(page, `${EVIDENCE}/manage-human-row-1024.png`);
  });
});
