import { expect, test, type Page } from "@playwright/test";
import { waitForLayout, capturePage } from "./ready";

const DEMO_STEP = "Read invoice.pdf";
const EVIDENCE = ".docs/evidence/03-schema";

async function loadDemo(page: Page) {
  await page.goto("/");
  await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
  await waitForLayout(page);
}

function viewLabel(page: Page, name: "Before" | "After" | "Compare") {
  return page.locator("header").getByText(name, { exact: true });
}

test.describe("slice 3 schema evidence", () => {
  test("demo still loads as a persisted v2 document", async ({ page }) => {
    await loadDemo(page);
    await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem("automation-pitch.workflow"));
    expect(stored).toBeTruthy();
    const doc = JSON.parse(stored!);
    expect(doc.version).toBe(2);
    expect(doc.after).toEqual(
      expect.objectContaining({
        groups: [],
        extraNodes: [],
        extraEdges: [],
      }),
    );
    expect(doc.assignments.before).toBeUndefined();

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
});

test.describe("supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("demo board is usable at 1024 CSS pixels", async ({ page }) => {
    await loadDemo(page);
    await expect(viewLabel(page, "Before")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/before-light-1024.png`);
  });
});
