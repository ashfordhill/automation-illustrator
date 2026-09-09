import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark, enterDarkTheme } from "./ready";

const EVIDENCE = ".docs/evidence/improve-28-who-select";
const YELLOW_LIGHT = "rgb(232, 193, 74)";
const YELLOW_DARK = "rgb(226, 184, 74)";

async function openManageActors(page: import("@playwright/test").Page) {
  await page.locator("aside").getByRole("button", { name: "Manage actors" }).click();
  await expect(page.getByRole("heading", { name: "Manage actors" })).toBeVisible();
}

test.describe("Improvement 28 — Who select is yellow", () => {
  test("Manage actors selected card is yellow", async ({ page }) => {
    await loadOakPark(page);
    await openManageActors(page);
    const alice = page.locator("aside").getByRole("option", { name: "Alice" });
    await alice.click();
    await expect(alice).toHaveAttribute("aria-selected", "true");
    await expect(alice).toHaveCSS("background-color", YELLOW_LIGHT);
    await expect(alice).toHaveCSS("border-top-color", YELLOW_LIGHT);
    await expect(alice).toHaveCSS("border-top-width", "2px");
    await page.locator("aside").getByLabel("Name").click();
    await capturePage(page, `${EVIDENCE}/manage-actors-light-1440.png`);

    await enterDarkTheme(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(alice).toHaveCSS("background-color", YELLOW_DARK);
    await expect(alice).toHaveCSS("border-top-color", YELLOW_DARK);
    await page.locator("aside").getByLabel("Name").click();
    await capturePage(page, `${EVIDENCE}/manage-actors-dark-1440.png`);
  });

  test("Step inspector Who selected Alice is yellow", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText("Read invoice.pdf").first().click();
    const alice = page.locator("aside").getByRole("button", { name: "Who Alice" });
    await expect(alice).toHaveAttribute("aria-pressed", "true");
    await expect(alice).toHaveCSS("background-color", YELLOW_LIGHT);
    await page.locator("#step-name-field").click();
    await capturePage(page, `${EVIDENCE}/who-selected-light-1440.png`);
  });
});

test.describe("Improvement 28 — min width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Manage actors selected card still reads at 1024", async ({ page }) => {
    await loadOakPark(page);
    await openManageActors(page);
    const alice = page.locator("aside").getByRole("option", { name: "Alice" });
    await alice.click();
    await expect(alice).toHaveCSS("background-color", YELLOW_LIGHT);
    await page.locator("aside").getByLabel("Name").click();
    await capturePage(page, `${EVIDENCE}/manage-actors-1024.png`);
  });
});
