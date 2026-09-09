import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { waitForLayout, capturePage } from "./ready";

const DEMO_STEP = "Read invoice.pdf";
const MAIL_STEP = "Read incoming mail";
const EVIDENCE = ".docs/evidence/improve-32-import-export";
const MAILROOM_YAML = readFileSync("src/demos/robot-mailroom.yaml", "utf8");

async function loadDemo(page: Page) {
  await page.goto("/");
  await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
  await waitForLayout(page);
}

async function openMenu(page: Page) {
  await page.getByRole("button", { name: "Menu" }).click();
}

test.describe("Improvement 32 import and export", () => {
  test("hamburger Export downloads YAML of the open board", async ({ page }) => {
    await loadDemo(page);
    await openMenu(page);
    await expect(page.getByRole("menuitem", { name: "Export" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/hamburger-export-1440.png`);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("menuitem", { name: "Export" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("oak-park-invoice.yaml");
    const path = await download.path();
    expect(path).toBeTruthy();
    const text = readFileSync(path!, "utf8");
    expect(text).toContain("name: Oak Park Invoice");
    expect(text).toContain("version: 2");
    expect(text.trimStart().startsWith("{")).toBe(false);
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();
  });

  test("Import YAML loads Robot Mailroom through the replace gate", async ({ page }) => {
    await loadDemo(page);
    await page.setInputFiles('input[type="file"]', {
      name: "robot-mailroom.yaml",
      mimeType: "text/yaml",
      buffer: Buffer.from(MAILROOM_YAML),
    });
    await expect(page.getByRole("dialog", { name: "Import this board?" })).toBeVisible();
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText(MAIL_STEP).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(DEMO_STEP)).toHaveCount(0);
    await waitForLayout(page);
    await capturePage(page, `${EVIDENCE}/import-mailroom-1440.png`);
  });

  test("invalid YAML does not replace the live board", async ({ page }) => {
    await loadDemo(page);
    await page.setInputFiles('input[type="file"]', {
      name: "bad.yaml",
      mimeType: "text/yaml",
      buffer: Buffer.from("{"),
    });
    await expect(page.getByRole("dialog", { name: "Could not import" })).toBeVisible();
    await expect(page.getByText("not valid YAML or JSON")).toBeVisible();
    await page.getByRole("button", { name: "OK" }).click();
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();
  });
});

test.describe("supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Export remains in the hamburger at 1024", async ({ page }) => {
    await loadDemo(page);
    await openMenu(page);
    await expect(page.getByRole("menuitem", { name: "Export" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/hamburger-export-1024.png`);
  });
});
