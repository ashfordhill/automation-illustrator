import { expect, test, type Page } from "@playwright/test";
import { waitForLayout, capturePage, pathScreenPoint } from "./ready";

const DEMO_STEP = "Read invoice.pdf";
const EVIDENCE = ".docs/evidence/04-commands";

async function loadDemo(page: Page) {
  await page.goto("/");
  await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
  await waitForLayout(page);
}

function viewLabel(page: Page, name: "Before" | "After" | "Compare") {
  return page.locator("header").getByText(name, { exact: true });
}

test.describe("slice 4 command evidence", () => {
  test("demo board still compares Before / After / Both", async ({ page }) => {
    await loadDemo(page);
    await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/before-light-1440.png`);

    await viewLabel(page, "After").click();
    await expect(page.getByRole("radio", { name: "After", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await capturePage(page, `${EVIDENCE}/after-light-1440.png`);

    await viewLabel(page, "Compare").click();
    await expect(page.getByRole("radio", { name: "Compare", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator('.board-lane[data-lane="before"]')).toBeVisible();
    await expect(page.locator('.board-lane[data-lane="after"]')).toBeVisible();
    await capturePage(page, `${EVIDENCE}/both-light-1440.png`);
  });

  test("Path inspector has no Delete control; Delete explains Node removal", async ({
    page,
  }) => {
    await loadDemo(page);
    await page.getByText("invoice > $50,000").first().click();
    await expect(page.locator("#path-condition-field")).toBeVisible();
    await expect(page.locator("aside").getByRole("button", { name: "Delete" })).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/path-no-delete-1440.png`);

    const leafPath = await pathScreenPoint(page, "e_review_3", 0.5);
    await page.mouse.click(leafPath.x, leafPath.y);
    await page.keyboard.press("Delete");
    await expect(page.getByText(/would split the board into separate workflows/i)).toBeVisible();
  });

  test("a source that would split the board is blocked; a leaf can be removed", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "New" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await page.getByRole("button", { name: "Add Step" }).click();
    await waitForLayout(page);
    await page.keyboard.press("e");
    await waitForLayout(page);
    await page.locator(".react-flow__node:not(.selected)").first().click();
    await page.keyboard.press("e");
    await waitForLayout(page);
    const nodes = page.locator(".react-flow__node");
    const n = await nodes.count();
    let left = 0;
    let leftX = Infinity;
    for (let i = 0; i < n; i++) {
      const box = await nodes.nth(i).boundingBox();
      if (box && box.x < leftX) {
        leftX = box.x;
        left = i;
      }
    }
    await nodes.nth(left).click();
    await page.keyboard.press("Delete");
    await expect(page.getByText("Removing this Tile would split the board into separate workflows.")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/root-blocked-1440.png`);

    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Oak Park Invoice" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
    await waitForLayout(page);
    await page.getByText("manager").first().click();
    await page.keyboard.press("Delete");
    await expect(page.getByText("manager")).toHaveCount(0);
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();
  });
});

test.describe("supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("demo board is usable at 1024 CSS pixels", async ({ page }) => {
    await loadDemo(page);
    await expect(viewLabel(page, "Before")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/before-light-1024.png`);
  });
});
