import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { capturePage, loadOakPark } from "./ready";

const EVIDENCE = ".docs/evidence/improve-66-theme-presets";
const FRAME_DEFAULT = "rgb(12, 51, 73)";
const FRAME_SWATCH = "rgb(128, 32, 32)"; // first THEME_COLOR_SWATCHES entry
const WELL_DEFAULT = "rgb(7, 32, 45)";
const WELL_SWATCH = "rgb(26, 92, 58)"; // second swatch

async function openTheme(page: Page) {
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("menuitem", { name: "Theme" }).click();
  const dialog = page.getByRole("dialog", { name: "Theme" });
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Click the Nth swatch in the open ColorField popover. */
async function pickSwatch(page: Page, index: number) {
  await page.locator(".inspector-color-pop .mantine-ColorSwatch-root").nth(index).click();
}

/** Inline override on :root, "" when the theme is Ice (no overrides). */
function rootVar(page: Page, name: string) {
  return page.evaluate((n) => document.documentElement.style.getPropertyValue(n), name);
}

test.describe("Improvement 66 — theme presets, Save, theme files, paper texture", () => {
  test("draft edits paint only the preview; Save on an edited built-in asks for a name", async ({
    page,
  }) => {
    await loadOakPark(page);
    const dialog = await openTheme(page);
    const statusBar = page.locator("footer.status-bar");
    const previewBar = dialog.locator(".theme-preview-bar");

    await expect(dialog.getByRole("combobox", { name: "Theme preset" })).toHaveValue("Ice");
    await expect(dialog.locator("[data-theme-edited]")).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: "Reset" })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Delete theme" })).toHaveCount(0);

    await dialog.getByRole("button", { name: "Frame color" }).click();
    await pickSwatch(page, 0);
    await expect(previewBar).toHaveCSS("background-color", FRAME_SWATCH);
    await expect(statusBar).toHaveCSS("background-color", FRAME_DEFAULT);
    await expect(dialog.locator("[data-theme-edited]")).toHaveText("Edited");
    await expect(dialog.getByRole("combobox", { name: "Theme preset" })).toHaveValue("Ice");
    await expect(dialog.getByRole("button", { name: "Reset" })).toBeEnabled();
    await capturePage(page, `${EVIDENCE}/theme-draft-edited-1440.png`);

    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    const prompt = page.getByRole("dialog", { name: "Save theme" });
    await expect(prompt).toBeVisible();
    await expect(prompt.getByText("Built-in themes can't be overwritten.")).toBeVisible();
    await expect(prompt.getByRole("button", { name: /Save over/ })).toHaveCount(0);
    await expect(prompt.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
    await prompt.getByRole("textbox", { name: "Name" }).fill("Ice");
    await expect(prompt.getByText("That name is already used")).toBeVisible();
    await prompt.getByRole("textbox", { name: "Name" }).fill("Ember");
    await capturePage(page, `${EVIDENCE}/theme-save-as-new-1440.png`);
    await prompt.getByRole("button", { name: "Save", exact: true }).click();

    await expect(dialog).toHaveCount(0);
    await expect(statusBar).toHaveCSS("background-color", FRAME_SWATCH);

    // Reopen: the new preset is selected and listed under My themes with a trash.
    const again = await openTheme(page);
    await expect(again.getByRole("combobox", { name: "Theme preset" })).toHaveValue("Ember");
    await expect(again.getByRole("button", { name: "Delete theme" })).toBeVisible();
    await again.getByRole("combobox", { name: "Theme preset" }).click();
    await expect(page.getByRole("option", { name: "Ice", exact: true })).toBeVisible();
    await expect(page.getByRole("option", { name: "Graphite" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Forest" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Plum" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Ember" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/theme-dropdown-1440.png`);
    await page.keyboard.press("Escape");
    await expect(again).toBeVisible();

    // Trash on the custom preset selects Ice and applies it (it was the applied theme).
    await again.getByRole("button", { name: "Delete theme" }).click();
    await expect(again.getByRole("combobox", { name: "Theme preset" })).toHaveValue("Ice");
    await expect(statusBar).toHaveCSS("background-color", FRAME_DEFAULT);
    await expect(again.getByRole("button", { name: "Delete theme" })).toHaveCount(0);
  });

  test("closing an edited draft asks Discard changes?; Keep editing keeps it, Discard drops it", async ({
    page,
  }) => {
    await loadOakPark(page);
    const dialog = await openTheme(page);
    await dialog.getByRole("button", { name: "Paper color" }).click();
    await pickSwatch(page, 0);
    await expect(dialog.locator("[data-theme-edited]")).toBeVisible();

    await dialog.getByRole("button", { name: "Close" }).click();
    const confirm = page.getByRole("dialog", { name: "Discard changes?" });
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: "Keep editing" }).click();
    await expect(confirm).toHaveCount(0);
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("[data-theme-edited]")).toBeVisible();

    // Escape: the nested confirm closes first, then the window.
    await page.keyboard.press("Escape");
    await expect(confirm).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(confirm).toHaveCount(0);
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await confirm.getByRole("button", { name: "Discard" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator("footer.status-bar")).toHaveCSS("background-color", FRAME_DEFAULT);
    expect(await rootVar(page, "--chrome")).toBe("");

    // Reopened window shows the applied (unedited) Ice again; unedited Escape closes at once.
    const again = await openTheme(page);
    await expect(again.locator("[data-theme-edited]")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(again).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Menu" })).toBeFocused();
  });

  test("Export downloads ice.theme.yaml; Import of that file adds Ice 2 without applying", async ({
    page,
  }) => {
    await loadOakPark(page);
    const dialog = await openTheme(page);
    const downloadPromise = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Export" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("ice.theme.yaml");
    const yaml = readFileSync((await download.path())!, "utf8");
    expect(yaml.startsWith("version: 1\nname: Ice\n")).toBe(true);
    expect(yaml).toContain('chrome: "#0c3349"');
    expect(yaml).toContain("pattern: dots");

    await dialog.locator("[data-theme-file-input]").setInputFiles({
      name: "ice.theme.yaml",
      mimeType: "text/yaml",
      buffer: Buffer.from(yaml, "utf8"),
    });
    await expect(dialog.getByRole("combobox", { name: "Theme preset" })).toHaveValue("Ice 2");
    await expect(dialog.getByRole("button", { name: "Delete theme" })).toBeVisible();
    expect(await rootVar(page, "--chrome")).toBe("");

    await dialog.locator("[data-theme-file-input]").setInputFiles({
      name: "broken.theme.yaml",
      mimeType: "text/yaml",
      buffer: Buffer.from("version: 1\nname: Broken\ncolors: nope\n", "utf8"),
    });
    await expect(page.getByText("Theme file is not valid")).toBeVisible();
    await expect(dialog.getByRole("combobox", { name: "Theme preset" })).toHaveValue("Ice 2");
  });

  test("texture Mesh and Well reach the board and switches after Save", async ({ page }) => {
    await loadOakPark(page);
    await expect(page.locator(".paper-texture[data-paper-texture='dots']").first()).toBeAttached();
    const dialog = await openTheme(page);

    await dialog.getByRole("button", { name: /Texture pattern/ }).click();
    const grid = page.getByRole("radiogroup", { name: "Texture pattern" });
    await expect(grid.getByRole("radio")).toHaveCount(4);
    await capturePage(page, `${EVIDENCE}/theme-texture-popover-1440.png`);
    await grid.getByRole("radio", { name: "Mesh" }).click();
    await expect(dialog.locator(".theme-preview-texture")).toHaveAttribute("data-paper-texture", "mesh");
    await expect(page.locator(".paper-texture").first()).toHaveAttribute("data-paper-texture", "dots");

    const orientation = page.locator("footer.status-bar .orientation-switch");
    await expect(orientation).toHaveCSS("border-top-color", WELL_DEFAULT);
    await expect(orientation.locator(".view-switch-track")).toHaveCSS("background-color", WELL_DEFAULT);
    await dialog.getByRole("button", { name: "Well color" }).click();
    await pickSwatch(page, 1);
    await expect(orientation).toHaveCSS("border-top-color", WELL_DEFAULT);
    // Escape closes only the color popover (it sits over Save); the window stays open.
    await page.keyboard.press("Escape");
    await expect(page.locator(".inspector-color-pop")).toHaveCount(0);
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    const prompt = page.getByRole("dialog", { name: "Save theme" });
    await prompt.getByRole("textbox", { name: "Name" }).fill("Mesh well");
    await prompt.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog).toHaveCount(0);

    await expect(page.locator(".paper-texture").first()).toHaveAttribute("data-paper-texture", "mesh");
    await expect(orientation).toHaveCSS("border-top-color", WELL_SWATCH);
    await expect(orientation).toHaveCSS("background-color", WELL_SWATCH);
    await expect(orientation.locator(".view-switch-track")).toHaveCSS("background-color", WELL_SWATCH);
    await expect(page.locator("header .lane-switch")).toHaveCSS("border-top-color", WELL_SWATCH);
    await capturePage(page, `${EVIDENCE}/theme-mesh-board-1440.png`);
  });

  test("status bar has no hairline above its outline; axe on the open Theme window", async ({
    page,
  }) => {
    await loadOakPark(page);
    await expect(page.locator("footer.status-bar")).toHaveCSS("box-shadow", "none");
    const dialog = await openTheme(page);
    await expect(dialog.locator(".theme-preview-status")).toHaveCSS("box-shadow", "none");
    const results = await new AxeBuilder({ page })
      .include(".mantine-Modal-content")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        help: v.help,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  });
});

test.describe("Improvement 66 theme window at 1024", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Theme window fits the min supported width", async ({ page }) => {
    await loadOakPark(page);
    const dialog = await openTheme(page);
    await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Texture pattern/ })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/theme-1024.png`);
  });
});
