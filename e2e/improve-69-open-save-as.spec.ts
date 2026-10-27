import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import {
  answerSaveDialog,
  capturePage,
  DEMO_STEP,
  loadOakPark,
  recordSaveDialog,
  savedCount,
  savedFile,
  withoutSaveDialog,
} from "./ready";

const EVIDENCE = ".docs/evidence/improve-69-open-save-as";
const MAIL_STEP = "Read incoming mail";

async function openMenu(page: Page) {
  await page.getByRole("button", { name: "Menu" }).click();
}

async function saveAs(page: Page) {
  await openMenu(page);
  await page.getByRole("menuitem", { name: "Save as…" }).click();
}

/** Mantine fades a modal in; wait until it is fully drawn. */
async function shown(page: Page, name: string) {
  const dialog = page.getByRole("dialog", { name });
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  return dialog;
}

async function openExportImage(page: Page) {
  await openMenu(page);
  await page.getByRole("menuitem", { name: "Export image" }).click();
  const dialog = await shown(page, "Export image");
  await expect(dialog.locator('.export-image-preview[data-ready="true"] img')).toBeVisible({
    timeout: 15_000,
  });
  return dialog;
}

async function newBoard(page: Page) {
  await openMenu(page);
  await page.getByRole("menuitem", { name: "New" }).click();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(page.getByText("This board is empty.")).toBeVisible();
}

test.describe("Improvement 69 Open and Save as", () => {
  test("the hamburger says Open and Save as…", async ({ page }) => {
    await loadOakPark(page);
    await openMenu(page);
    const items = (await page.getByRole("menuitem").allTextContents()).map((t) => t.trim());
    expect(items.slice(0, 4)).toEqual(["New", "Open", "Save as…", "Export image"]);
    await capturePage(page, `${EVIDENCE}/hamburger-open-save-as-1440.png`);
  });

  test("a name typed in the save dialog becomes the project name", async ({ page }) => {
    await recordSaveDialog(page);
    await loadOakPark(page);
    await answerSaveDialog(page, "Invoice Flow.illustrator");
    await saveAs(page);
    const file = await savedFile(page);
    expect(file.suggestedName).toBe("oak-park-invoice.illustrator");
    expect(file.name).toBe("Invoice Flow.illustrator");
    expect(JSON.parse(file.text).name).toBe("Invoice Flow");

    const dialog = await openExportImage(page);
    await expect(dialog.getByLabel("Name")).toHaveValue("Invoice Flow");
    await expect(dialog.getByText("invoice-flow.before.svg")).toBeVisible();
  });

  test("Save copy that is canceled keeps the board and the question", async ({ page }) => {
    await recordSaveDialog(page);
    await loadOakPark(page);
    await openMenu(page);
    await page.getByRole("menuitem", { name: "Robot Mailroom" }).click();
    await answerSaveDialog(page, null);
    await page.getByRole("button", { name: "Save copy" }).click();
    await expect(page.getByRole("dialog", { name: "Load Robot Mailroom?" })).toBeVisible();
    expect(await savedCount(page)).toBe(0);
    await page.getByRole("button", { name: "Save copy" }).click();
    expect((await savedFile(page)).name).toBe("oak-park-invoice.illustrator");
    await expect(page.getByText(MAIL_STEP).first()).toBeVisible({ timeout: 15_000 });
  });

  test("Export image names an untitled project and saves under that name", async ({ page }) => {
    await recordSaveDialog(page);
    await loadOakPark(page);
    await newBoard(page);
    await page.getByRole("button", { name: "Add Step" }).click();
    const dialog = await openExportImage(page);
    const name = dialog.getByLabel("Name");
    await expect(name).toHaveValue("");
    await expect(name).toHaveAttribute("placeholder", "Untitled");
    await expect(dialog.getByText("untitled.before.svg")).toBeVisible();
    await name.fill("Field Visit");
    await expect(dialog.getByText("field-visit.before.svg")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/export-image-name-1440.png`);
    await dialog.getByRole("button", { name: "Save…" }).click();
    const image = await savedFile(page);
    expect(image.suggestedName).toBe("field-visit.before.svg");
    expect(image.text).toContain("<title>Field Visit — Before</title>");
    await expect(page.getByRole("dialog", { name: "Export image" })).toHaveCount(0);

    await saveAs(page);
    expect((await savedFile(page, 1)).suggestedName).toBe("field-visit.illustrator");
  });
});

test.describe("Improvement 69 without a save dialog", () => {
  test.beforeEach(async ({ page }) => {
    await withoutSaveDialog(page);
  });

  test("Save as… asks for a file name in the app, then downloads it", async ({ page }) => {
    await loadOakPark(page);
    await saveAs(page);
    const dialog = await shown(page, "Save as");
    const field = dialog.getByLabel("File name");
    await expect(field).toHaveValue("oak-park-invoice.illustrator");
    await expect(field).toBeFocused();
    await expect
      .poll(() => field.evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd]))
      .toEqual([0, "oak-park-invoice".length]);
    await capturePage(page, `${EVIDENCE}/save-as-name-1440.png`);
    await page.keyboard.type("Oak Park v2");
    const pending = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe("Oak Park v2.illustrator");
    expect(JSON.parse(readFileSync((await download.path())!, "utf8")).name).toBe("Oak Park v2");
    await expect(page.getByRole("dialog", { name: "Save as" })).toHaveCount(0);
  });

  test("Escape in the name prompt cancels only the prompt, over Export image", async ({ page }) => {
    await loadOakPark(page);
    const exportDialog = await openExportImage(page);
    await exportDialog.getByRole("button", { name: "Save…" }).click();
    await shown(page, "Save as");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Save as" })).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: "Export image" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Export image" })).toHaveCount(0);
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();
  });
});
