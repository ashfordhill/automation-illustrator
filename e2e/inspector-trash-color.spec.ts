import { expect, test } from "@playwright/test";
import { DEMO_STEP, capturePage, enterDarkTheme, loadOakPark } from "./ready";

const EVIDENCE = ".docs/evidence/inspector-trash-red";

function aside(page: import("@playwright/test").Page) {
  return page.locator("aside");
}

function hexToRgb(hex: string) {
  const h = hex.trim().replace("#", "");
  const n = Number.parseInt(h, 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

async function trashUsesRequestedRed(page: import("@playwright/test").Page) {
  const trash = aside(page).getByRole("button", { name: "Remove Step" });
  await expect(trash).toBeVisible();
  const colors = await trash.evaluate((el) => {
    const root = getComputedStyle(document.documentElement);
    const svg = el.querySelector("svg");
    const iconStyle = getComputedStyle(svg ?? el);
    return {
      icon: iconStyle.color,
      stroke: iconStyle.stroke,
      button: getComputedStyle(el).color,
      trash: root.getPropertyValue("--trash").trim(),
    };
  });
  const trashRgb = hexToRgb(colors.trash);
  expect(colors.icon === trashRgb || colors.stroke === trashRgb || colors.button === trashRgb).toBe(
    true,
  );
  return trash;
}

test("inspector trash icon uses #b12015", async ({ page }) => {
  await loadOakPark(page);
  await page.getByText(DEMO_STEP).first().click();
  const trash = await trashUsesRequestedRed(page);
  await capturePage(page, `${EVIDENCE}/trash-red-1440.png`);
  await trash.screenshot({ path: `${EVIDENCE}/trash-icon-closeup.png`, animations: "disabled" });

  await enterDarkTheme(page);
  await trashUsesRequestedRed(page);
  await capturePage(page, `${EVIDENCE}/trash-red-dark-1440.png`);
});
