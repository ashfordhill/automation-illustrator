import { expect, test } from "@playwright/test";
import { loadOakPark, screenshotBoard, waitForLayout, enterDarkTheme } from "./ready";

const EVIDENCE = ".docs/evidence/improve-26-compare";
const CYAN_LINE = "rgb(94, 200, 232)";

function viewRadio(page: import("@playwright/test").Page, name: "Before" | "After" | "Compare") {
  return page.getByRole("radio", { name, exact: true });
}

async function laneOutline(page: import("@playwright/test").Page, lane: "before" | "after") {
  return page.locator(`.board-lane[data-lane="${lane}"]`).evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      className: el.className,
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
    };
  });
}

test.describe("Improvement 26 — Compare without pan outline", () => {
  test("Compare is the switch label and neither lane has a cyan outline", async ({ page }) => {
    await loadOakPark(page);
    await expect(viewRadio(page, "Compare")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Both", exact: true })).toHaveCount(0);

    await viewRadio(page, "Compare").click();
    await waitForLayout(page);
    await expect(viewRadio(page, "Compare")).toHaveAttribute("aria-checked", "true");
    await expect(page.locator('.board-lane[data-lane="before"]')).toBeVisible();
    await expect(page.locator('.board-lane[data-lane="after"]')).toBeVisible();

    for (const lane of ["before", "after"] as const) {
      const outline = await laneOutline(page, lane);
      expect(outline.className.split(/\s+/)).not.toContain("is-pan-target");
      expect(outline.outlineStyle === "none" || outline.outlineWidth === "0px").toBe(true);
      expect(outline.outlineColor).not.toBe(CYAN_LINE);
    }

    await screenshotBoard(page, `${EVIDENCE}/compare-light-1440.png`);

    await enterDarkTheme(page);
    await waitForLayout(page);
    await screenshotBoard(page, `${EVIDENCE}/compare-dark-1440.png`);
  });
});
