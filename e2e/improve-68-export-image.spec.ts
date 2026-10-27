import { expect, test, type Page } from "@playwright/test";
import { BOARD_TOKENS } from "../src/export/boardTokens";
import {
  capturePage,
  DEMO_STEP,
  loadOakPark,
  recordSaveDialog,
  savedCount,
  savedFile,
  viewSwitchRadio,
} from "./ready";

const EVIDENCE = ".docs/evidence/improve-68-export-image";
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function openExportImage(page: Page) {
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("menuitem", { name: "Export image" }).click();
  const dialog = page.getByRole("dialog", { name: "Export image" });
  await expect(dialog.locator('.export-image-preview[data-ready="true"] img')).toBeVisible({
    timeout: 15_000,
  });
  await expect.poll(() => dialog.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  return dialog;
}

async function saveImage(page: Page, dialog: ReturnType<Page["getByRole"]>) {
  const before = await savedCount(page);
  await dialog.getByRole("button", { name: "Save…" }).click();
  return savedFile(page, before);
}

test.describe("Improvement 68 Export image", () => {
  test.beforeEach(async ({ page }) => {
    await recordSaveDialog(page);
  });

  test("Compare opens from Compare and saves a vector SVG of both lanes", async ({ page }) => {
    await loadOakPark(page);
    await viewSwitchRadio(page, "Compare").click();
    const dialog = await openExportImage(page);
    await expect(dialog.getByRole("radio", { name: "Compare" })).toBeChecked();
    await expect(dialog.getByText("oak-park-invoice.svg")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/export-image-compare-1440.png`);
    const file = await saveImage(page, dialog);
    expect(file.name).toBe("oak-park-invoice.svg");
    const svg = file.bytes.toString("utf8");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain(">Before</text>");
    expect(svg).toContain(">After</text>");
    expect(svg).toContain("Read invoice.pdf");
    expect(svg).toContain("@font-face");
    expect(svg).not.toContain("var(--");
    await expect(page.getByRole("dialog", { name: "Export image" })).toHaveCount(0);
  });

  test("Before as PNG saves name.before.png", async ({ page }) => {
    await loadOakPark(page);
    const dialog = await openExportImage(page);
    await expect(dialog.getByRole("radio", { name: "Before" })).toBeChecked();
    await dialog.getByText("PNG", { exact: true }).click();
    await expect(dialog.getByText("oak-park-invoice.before.png")).toBeVisible();
    const file = await saveImage(page, dialog);
    expect(file.name).toBe("oak-park-invoice.before.png");
    expect(file.bytes.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
    expect(file.bytes.readUInt32BE(16)).toBeGreaterThan(1000);
  });

  test("Cancel and Escape close without saving; board keys stay inert while open", async ({ page }) => {
    await loadOakPark(page);
    const tile = page.getByText("Search website");
    await tile.first().click();
    let dialog = await openExportImage(page);
    await page.keyboard.press("Delete");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog", { name: "Export image" })).toHaveCount(0);
    await expect(tile).toHaveCount(1);
    dialog = await openExportImage(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Export image" })).toHaveCount(0);
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();
    expect(await savedCount(page)).toBe(0);
    await tile.first().click();
    await page.keyboard.press("Delete");
    await expect(tile).toHaveCount(0);
  });

  test("export colors match the live light board tokens", async ({ page }) => {
    await loadOakPark(page);
    const live = await page.evaluate((names) => {
      const style = getComputedStyle(document.documentElement);
      return Object.fromEntries(names.map((n) => [n, style.getPropertyValue(n).trim()]));
    }, Object.keys(BOARD_TOKENS));
    expect(live).toEqual(BOARD_TOKENS);
  });
});

test.describe("Export image at min width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("the window fits at 1024", async ({ page }) => {
    await loadOakPark(page);
    await openExportImage(page);
    await capturePage(page, `${EVIDENCE}/export-image-1024.png`);
  });
});
