import { expect, test } from "@playwright/test";
import { capturePage, loadOakPark, enterDarkTheme } from "./ready";

const EVIDENCE = ".docs/evidence/improve-28-fold-hover";
const STEEL_LIGHT = "rgb(63, 95, 113)";
const STEEL_DARK = "rgb(59, 74, 81)";
const CREAM_LIGHT = "rgb(247, 252, 254)";
const YELLOW_LIGHT = "rgb(232, 193, 74)";
const CREAM_DARK = "rgb(30, 51, 64)";
const YELLOW_DARK = "rgb(226, 184, 74)";
const ICE = "rgb(243, 251, 254)";
const BLUE_LIGHT = "rgb(26, 143, 212)";
const BLUE_DARK = "rgb(126, 182, 224)";

function parseRgbTriple(value: string): [number, number, number] {
  const rgb = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!rgb) throw new Error(`unparsed rgb ${value}`);
  return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
}

async function backgroundRgb(fold: import("@playwright/test").Locator) {
  return fold.evaluate((el) => {
    const raw = getComputedStyle(el).backgroundColor;
    const srgb = raw.match(/color\(srgb\s+([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
    if (srgb) {
      return [
        Math.round(Number(srgb[1]) * 255),
        Math.round(Number(srgb[2]) * 255),
        Math.round(Number(srgb[3]) * 255),
      ] as [number, number, number];
    }
    const rgb = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgb) {
      return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] as [number, number, number];
    }
    throw new Error(`unparsed background ${raw}`);
  });
}

async function expectSteelHover(
  fold: import("@playwright/test").Locator,
  steel: string,
  cream: string,
  yellow: string,
) {
  const expected = parseRgbTriple(steel);
  await fold.hover();
  await expect
    .poll(async () => {
      try {
        const bg = await backgroundRgb(fold);
        return (
          Math.abs(bg[0] - expected[0]) <= 2 &&
          Math.abs(bg[1] - expected[1]) <= 2 &&
          Math.abs(bg[2] - expected[2]) <= 2
        );
      } catch {
        return false;
      }
    })
    .toBe(true);
  const bg = await backgroundRgb(fold);
  expect(bg).not.toEqual(parseRgbTriple(cream));
  expect(bg).not.toEqual(parseRgbTriple(yellow));
  await expect(fold).toHaveCSS("color", ICE);
  await expect(fold).toHaveCSS("outline-style", "none");
}

test.describe("Improvement 28 correction — inspector fold hover", () => {
  test("Hide inspector hover is a steel lift, not cream yellow or blue", async ({ page }) => {
    await loadOakPark(page);
    const fold = page.getByRole("button", { name: "Hide inspector" });
    await expect(fold).toBeVisible();
    await expectSteelHover(fold, STEEL_LIGHT, CREAM_LIGHT, YELLOW_LIGHT);
    await capturePage(page, `${EVIDENCE}/fold-hover-open-1440.png`);

    await fold.click();
    const show = page.getByRole("button", { name: "Show inspector" });
    await expect(show).toBeVisible();
    await expectSteelHover(show, STEEL_LIGHT, CREAM_LIGHT, YELLOW_LIGHT);
    await capturePage(page, `${EVIDENCE}/fold-hover-collapsed-1440.png`);
  });

  test("fold hover in dark stays steel, not cream yellow or blue", async ({ page }) => {
    await loadOakPark(page);
    await enterDarkTheme(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const fold = page.getByRole("button", { name: "Hide inspector" });
    await expectSteelHover(fold, STEEL_DARK, CREAM_DARK, YELLOW_DARK);
    const outline = await fold.evaluate((el) => getComputedStyle(el).outlineColor);
    expect(outline).not.toBe(BLUE_DARK);
    expect(outline).not.toBe(BLUE_LIGHT);
    await capturePage(page, `${EVIDENCE}/fold-hover-dark-1440.png`);
  });
});
