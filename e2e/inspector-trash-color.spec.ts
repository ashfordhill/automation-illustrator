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

async function trashUsesIdleXRed(page: import("@playwright/test").Page) {
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
      active: root.getPropertyValue("--minus-active").trim(),
      idle: root.getPropertyValue("--minus").trim(),
    };
  });
  const active = hexToRgb(colors.active);
  const idle = hexToRgb(colors.idle);
  expect(colors.icon === idle || colors.stroke === idle || colors.button === idle).toBe(true);
  expect(colors.icon).not.toBe(active);
  return trash;
}

test("inspector trash icon uses idle tile-X red", async ({ page }) => {
  await loadOakPark(page);
  await page.getByText(DEMO_STEP).first().click();
  const trash = await trashUsesIdleXRed(page);
  await capturePage(page, `${EVIDENCE}/trash-red-1440.png`);
  await trash.screenshot({ path: `${EVIDENCE}/trash-icon-closeup.png`, animations: "disabled" });

  await enterDarkTheme(page);
  await trashUsesIdleXRed(page);
  await capturePage(page, `${EVIDENCE}/trash-red-dark-1440.png`);
});
