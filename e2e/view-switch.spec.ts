import { expect, test } from "@playwright/test";
import { loadOakPark, screenshotBoard } from "./ready";

const EVIDENCE = ".docs/evidence/improve-05-chrome";
const CYAN_LINE = "rgb(94, 200, 232)";

function viewRadio(page: import("@playwright/test").Page, name: "Before" | "After" | "Both") {
  return page.getByRole("radio", { name, exact: true });
}

test.describe("Improvement 05 Step stay-put and chunky view switch", () => {
  test("view switch changes lanes, yellow meets the ink frame, selected Step stays put", async ({
    page,
  }) => {
    await loadOakPark(page);
    await expect(viewRadio(page, "Before")).toHaveAttribute("aria-checked", "true");
    await expect(viewRadio(page, "After")).toHaveAttribute("aria-checked", "false");
    await expect(viewRadio(page, "Both")).toHaveAttribute("aria-checked", "false");

    const frame = await page.locator(".view-switch").evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        borderColor: cs.borderTopColor,
        borderWidth: cs.borderTopWidth,
      };
    });
    expect(frame.borderColor).not.toBe(CYAN_LINE);
    expect(parseFloat(frame.borderWidth)).toBeGreaterThanOrEqual(3);

    const selectedFill = await page.locator(".view-switch-btn.is-on").evaluate((el) => {
      const cs = getComputedStyle(el);
      return { background: cs.backgroundColor, boxShadow: cs.boxShadow };
    });
    expect(selectedFill.boxShadow).toBe("none");

    await screenshotBoard(page, `${EVIDENCE}/view-switch-before-1440.png`);

    await viewRadio(page, "After").click();
    await expect(viewRadio(page, "After")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText("AFTER", { exact: true })).toBeVisible();

    await viewRadio(page, "Both").click();
    await expect(viewRadio(page, "Both")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText("BEFORE", { exact: true })).toBeVisible();
    await expect(page.getByText("AFTER", { exact: true })).toBeVisible();

    await viewRadio(page, "Before").click();
    await expect(viewRadio(page, "Before")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText("BEFORE", { exact: true })).toBeVisible();

    await page.getByText("Search website", { exact: true }).first().click();
    await expect(page.locator("aside").getByRole("button", { name: "Type Search" })).toBeVisible();

    const selectedT = await page
      .locator('.react-flow__node[data-id="s_web"] .step-piece')
      .evaluate((el) => getComputedStyle(el).transform);
    const neighborT = await page
      .locator('.react-flow__node[data-id="s_fs"] .step-piece')
      .evaluate((el) => getComputedStyle(el).transform);
    expect(selectedT).toBe(neighborT);
    expect(selectedT === "none" || selectedT === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);

    await screenshotBoard(page, `${EVIDENCE}/step-select-1440.png`);
  });
});
