import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark, waitForLayout, showActorsHome } from "./ready";

const EVIDENCE = ".docs/evidence/improve-35-default-robots";

function viewLabel(page: import("@playwright/test").Page, name: "Before" | "After" | "Compare") {
  return page.locator("header").getByRole("radio", { name, exact: true });
}

function aside(page: import("@playwright/test").Page) {
  return page.locator("aside");
}

async function newBoard(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("menuitem", { name: "New" }).click();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(page.getByRole("button", { name: "Add Step" })).toBeVisible();
}

test.describe("Improvement 35 — default LLM Script Agent robots", () => {
  test("New board Who offers LLM, Script, Agent; After spawn inherits Who", async ({ page }) => {
    await newBoard(page);
    await page.getByRole("button", { name: "Add Step" }).click();
    await waitForLayout(page);
    await expect(aside(page).getByRole("button", { name: "Who Robot LLM" })).toBeVisible();
    await expect(aside(page).getByRole("button", { name: "Who Robot Script" })).toBeVisible();
    await expect(aside(page).getByRole("button", { name: "Who Robot Agent" })).toBeVisible();
    await expect(aside(page).getByRole("button", { name: "Who Robot", exact: true })).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/new-who-1440.png`);

    await showActorsHome(page);
    await expect(aside(page).getByRole("option", { name: "Robot LLM" })).toBeVisible();
    await expect(aside(page).getByRole("option", { name: "Robot Script" })).toBeVisible();
    await expect(aside(page).getByRole("option", { name: "Robot Agent" })).toBeVisible();
    await aside(page).getByRole("option", { name: "Robot LLM" }).click();
    await expect(aside(page).getByLabel("Name")).toHaveValue("Robot");
    await expect(aside(page).getByLabel("Role")).toHaveValue("LLM");
    await capturePage(page, `${EVIDENCE}/new-manage-actors-1440.png`);

    await viewLabel(page, "After").click();
    await waitForLayout(page);
    await page.locator(".react-flow__node").first().click();
    await page.keyboard.press("e");
    await waitForLayout(page);
    await expect(aside(page).getByRole("button", { name: "Who Alice" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await capturePage(page, `${EVIDENCE}/after-only-llm-1440.png`);
  });

  test("Oak Park After Read is LLM/LLM and Write is Script/Script", async ({ page }) => {
    await loadOakPark(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);

    await page.getByText("Read invoice.pdf").first().click();
    await expect(aside(page).getByRole("button", { name: "Who LLM" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const read = page.locator(".react-flow__node").filter({ hasText: "Read invoice.pdf" }).first();
    await expect(read.locator(".actor-chip-name")).toHaveText("LLM");
    await expect(read.locator(".actor-chip-role")).toHaveText("LLM");

    await page.getByText("Write BS&A Software").first().click();
    await expect(aside(page).getByRole("button", { name: "Who Script" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const write = page.locator(".react-flow__node").filter({ hasText: "Write BS&A Software" }).first();
    await expect(write.locator(".actor-chip-name")).toHaveText("Script");
    await expect(write.locator(".actor-chip-role")).toHaveText("Script");
    await capturePage(page, `${EVIDENCE}/oak-park-after-1440.png`);
  });
});

test.describe("Improvement 35 min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("New board Who still lists LLM Script Agent at 1024", async ({ page }) => {
    await newBoard(page);
    await page.getByRole("button", { name: "Add Step" }).click();
    await waitForLayout(page);
    await expect(aside(page).getByRole("button", { name: "Who Robot LLM" })).toBeVisible();
    await expect(aside(page).getByRole("button", { name: "Who Robot Script" })).toBeVisible();
    await expect(aside(page).getByRole("button", { name: "Who Robot Agent" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/new-who-1024.png`);
  });
});
