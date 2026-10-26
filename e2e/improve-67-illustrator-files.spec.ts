import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { capturePage, DEMO_STEP, loadOakPark, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-67-illustrator-files";
const MAIL_STEP = "Read incoming mail";

async function openMenu(page: Page) {
  await page.getByRole("button", { name: "Menu" }).click();
}

async function exportBoard(page: Page): Promise<{ name: string; text: string }> {
  await openMenu(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export" }).click();
  const download = await downloadPromise;
  return { name: download.suggestedFilename(), text: readFileSync((await download.path())!, "utf8") };
}

async function switchDemo(page: Page, name: "Oak Park Invoice" | "Robot Mailroom") {
  await openMenu(page);
  await page.getByRole("menuitem", { name }).click();
  await page.getByRole("button", { name: "Discard" }).click();
}

function importInput(page: Page) {
  return page.locator('header input[type="file"]');
}

/** Mantine fades a modal in; a screenshot taken at first visibility shows the board alone. */
async function expectDialogShown(page: Page, name: string) {
  const dialog = page.getByRole("dialog", { name });
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
}

test.describe("Improvement 67 .illustrator files", () => {
  test("Export writes <name>.illustrator with the type header first", async ({ page }) => {
    await loadOakPark(page);
    const file = await exportBoard(page);
    expect(file.name).toBe("oak-park-invoice.illustrator");
    expect(file.text.startsWith('{\n  "type": "automation-illustrator",\n  "version": 2,\n')).toBe(true);
    expect(JSON.parse(file.text)).toMatchObject({
      source: "https://github.com/ashfordhill/automation-illustrator",
      name: "Oak Park Invoice",
    });
  });

  test("an exported Robot Mailroom file imports back over Oak Park", async ({ page }) => {
    await loadOakPark(page);
    await switchDemo(page, "Robot Mailroom");
    await expect(page.getByText(MAIL_STEP).first()).toBeVisible({ timeout: 15_000 });
    const file = await exportBoard(page);
    expect(file.name).toBe("robot-mailroom.illustrator");

    await switchDemo(page, "Oak Park Invoice");
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
    await importInput(page).setInputFiles({
      name: file.name,
      mimeType: "application/octet-stream",
      buffer: Buffer.from(file.text),
    });
    await expectDialogShown(page, "Import this board?");
    await capturePage(page, `${EVIDENCE}/import-illustrator-1440.png`);
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText(MAIL_STEP).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(DEMO_STEP)).toHaveCount(0);
    await waitForLayout(page);
  });

  test("the Import picker offers .illustrator first; an .excalidraw file is refused", async ({ page }) => {
    await loadOakPark(page);
    await expect(importInput(page)).toHaveAttribute("accept", /^\.illustrator,\.yaml,\.yml,\.json,/);
    await importInput(page).setInputFiles({
      name: "diagram.excalidraw",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({ type: "excalidraw", version: 2, source: "https://excalidraw.com", elements: [] }),
      ),
    });
    await expectDialogShown(page, "Could not import");
    await expect(page.getByText("not an Automation Illustrator workflow")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/refuse-excalidraw-1440.png`);
    await page.getByRole("button", { name: "OK" }).click();
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();
  });
});
