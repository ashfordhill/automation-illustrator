import { expect, test, type Page } from "@playwright/test";
import { expectAxeClean } from "./axe";
import { DEMO_STEP, loadOakPark, screenshotBoard, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/12-release";
const MAIL_STEP = "Read incoming mail";
const RECEIPT = "Email delivery receipt to sender";

function viewRadio(page: Page, name: "Before" | "After" | "Both") {
  return page.getByRole("radio", { name, exact: true });
}

async function openMenu(page: Page) {
  await page.getByRole("button", { name: "Menu" }).click();
}

async function loadMailroom(page: Page) {
  await loadOakPark(page);
  await openMenu(page);
  await page.getByRole("menuitem", { name: "Robot Mailroom" }).click();
  await page.getByRole("button", { name: "Discard" }).click();
  await expect(page.getByText(MAIL_STEP).first()).toBeVisible({ timeout: 15_000 });
  await waitForLayout(page);
}

const V1_SEED = {
  version: 1,
  actors: [
    { id: "h_alice", kind: "human", name: "Alice", color: "#f4c6d4" },
    { id: "r_script", kind: "robot", name: "Robot", color: "#8aa8b8", robotKind: "script" },
  ],
  nodes: [
    {
      id: "s_read",
      type: "step",
      position: { x: 32, y: 160 },
      stepKind: "read",
      title: "invoice.pdf",
      detail: "",
      split: "exclusive",
      stub: true,
    },
    {
      id: "d_acct",
      type: "dataField",
      position: { x: 672, y: 192 },
      label: "Account #",
    },
  ],
  edges: [{ id: "e_acct", source: "s_read", target: "d_acct", label: "" }],
  assignments: {
    before: { s_read: "h_alice" },
    after: { s_read: "r_script" },
  },
};

test.describe("slice 12 unsupported viewport (P-04)", () => {
  test.use({ viewport: { width: 900, height: 700 } });

  test("under 1024 CSS pixels shows the unsupported message instead of the board", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "This window is too narrow" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("at least 1024 pixels wide")).toBeVisible();
    await expect(page.getByText(DEMO_STEP)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Menu" })).toHaveCount(0);
    await page.screenshot({
      path: `${EVIDENCE}/unsupported-900.png`,
      animations: "disabled",
    });
    await expectAxeClean(page);
  });
});

test.describe("slice 12 supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("1024 CSS pixels still shows the board", async ({ page }) => {
    await loadOakPark(page);
    await expect(viewRadio(page, "Before")).toBeVisible();
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();
    const aside = page.locator("aside");
    const box = await aside.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeLessThanOrEqual(320);
    await screenshotBoard(page, `${EVIDENCE}/before-light-1024.png`);
  });
});

test.describe("slice 12 persistence, keymap, and reload", () => {
  test("theme and sound survive reload", async ({ page }) => {
    await loadOakPark(page);
    await expect(page.getByRole("button", { name: "Sound off" })).toBeVisible();
    await page.getByRole("button", { name: "Sound off" }).click();
    await expect(page.getByRole("button", { name: "Sound on" })).toBeVisible();
    await openMenu(page);
    await page.getByRole("menuitem", { name: "Dark mode" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
    await waitForLayout(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: "Sound on" })).toBeVisible();
  });

  test("saved keymap ignores retired actions and keeps Undo rebound (SH-14)", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "automation-pitch.keymap",
        JSON.stringify({ undo: "z", toolPointer: "q", mystery: "k" }),
      );
    });
    await loadOakPark(page);
    await openMenu(page);
    await page.getByRole("menuitem", { name: "Keybinds" }).click();
    const dialog = page.getByRole("dialog", { name: "Keybinds" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Undo last (Z)" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Pointer/ })).toHaveCount(0);
    await page.screenshot({
      path: `${EVIDENCE}/keybinds-1440.png`,
      animations: "disabled",
    });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Menu" })).toBeFocused();
  });

  test("edited Name survives reload", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    const target = page.locator("aside").getByLabel("Name");
    await target.fill("invoice-reload.pdf");
    await target.blur();
    await page.reload();
    await expect(page.getByText("Read invoice-reload.pdf").first()).toBeVisible({ timeout: 15_000 });
    await waitForLayout(page);
  });

  test("quota-exceeded storage shows one Not saved chip (SH-11)", async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      };
    });
    await page.goto("/");
    await expect(page.getByText("Not saved")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/not-saved-1440.png`,
      animations: "disabled",
    });
  });

  test("valid v1 localStorage migrates on startup (SH-08)", async ({ page }) => {
    await page.addInitScript((doc) => {
      localStorage.setItem("automation-pitch.workflow", JSON.stringify(doc));
    }, V1_SEED);
    await page.goto("/");
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
    await waitForLayout(page);
    const stored = await page.evaluate(() => localStorage.getItem("automation-pitch.workflow"));
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!).version).toBe(2);
    expect(JSON.parse(stored!).assignments.s_read).toBe("h_alice");
  });
});

test.describe("slice 12 surfaces, dialogs, and final screenshots", () => {
  test("hamburger order, no Export, Before/After/Both in both themes", async ({ page }) => {
    await loadOakPark(page);
    await screenshotBoard(page, `${EVIDENCE}/before-light-1440.png`);

    await viewRadio(page, "After").click();
    await waitForLayout(page);
    await screenshotBoard(page, `${EVIDENCE}/after-light-1440.png`);

    await viewRadio(page, "Both").click();
    await waitForLayout(page);
    await expect(page.getByRole("button", { name: /Add / })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Merge and Unmerge" })).toHaveCount(0);
    await screenshotBoard(page, `${EVIDENCE}/both-light-1440.png`);

    await viewRadio(page, "Before").click();
    await openMenu(page);
    await expect(page.getByRole("menuitem", { name: "Present" })).toBeVisible();
    const items = await page.getByRole("menuitem").allTextContents();
    expect(items.map((t) => t.trim())).toEqual([
      "Present",
      "New",
      "Import",
      "Keybinds",
      "Dark mode",
      "Oak Park Invoice",
      "Robot Mailroom",
    ]);
    await expect(page.getByRole("menuitem", { name: "Export" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Redo/ })).toHaveCount(0);
    await page.screenshot({
      path: `${EVIDENCE}/hamburger-1440.png`,
      animations: "disabled",
    });
    await page.keyboard.press("Escape");

    await openMenu(page);
    await page.getByRole("menuitem", { name: "Dark mode" }).click();
    await waitForLayout(page);
    await screenshotBoard(page, `${EVIDENCE}/before-dark-1440.png`);
    await viewRadio(page, "After").click();
    await waitForLayout(page);
    await screenshotBoard(page, `${EVIDENCE}/after-dark-1440.png`);
    await viewRadio(page, "Both").click();
    await waitForLayout(page);
    await screenshotBoard(page, `${EVIDENCE}/both-dark-1440.png`);
  });

  test("Present, replace gate, and empty New", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    await openMenu(page);
    await page.getByRole("menuitem", { name: "Present" }).click();
    await expect(page.locator("aside")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Merge and Unmerge" })).toHaveCount(0);
    await expect(page.getByText(/will become automated/)).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/present-light-1440.png`);
    await openMenu(page);
    await page.getByRole("menuitem", { name: "Exit present" }).click();

    await openMenu(page);
    await page.getByRole("menuitem", { name: "New" }).click();
    await expect(page.getByRole("dialog", { name: "Start a new board?" })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/replace-gate-1440.png`,
      animations: "disabled",
    });
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByRole("button", { name: "Add Step" })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/empty-new-1440.png`,
      animations: "disabled",
    });
  });

  test("Mailroom After merge dock in both themes", async ({ page }) => {
    await loadMailroom(page);
    await viewRadio(page, "After").click();
    await waitForLayout(page);
    await expect(page.getByRole("region", { name: "Merge and Unmerge" })).toBeVisible();
    await expect(page.getByText(RECEIPT).first()).toBeVisible();
    await screenshotBoard(page, `${EVIDENCE}/mailroom-after-1440.png`);
    await openMenu(page);
    await page.getByRole("menuitem", { name: "Dark mode" }).click();
    await waitForLayout(page);
    await screenshotBoard(page, `${EVIDENCE}/mailroom-after-dark-1440.png`);
  });

  test("corrupt storage recovery dialog (SH-10)", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("automation-pitch.workflow", '{"version":1');
    });
    await page.goto("/");
    await expect(page.getByRole("dialog", { name: "Could not load the saved board" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Download recovery copy" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start fresh" })).toBeVisible();
    await page.screenshot({
      path: `${EVIDENCE}/recovery-1440.png`,
      animations: "disabled",
    });
  });
});

test.describe("slice 12 accessibility and reduced motion", () => {
  test("axe on Oak Park Before, Both, inspector, and Mailroom After", async ({ page }) => {
    await loadOakPark(page);
    await expectAxeClean(page);

    await page.getByText(DEMO_STEP).first().click();
    await expect(page.locator("aside").getByRole("button", { name: "Type Read" })).toBeVisible();
    await expectAxeClean(page);

    await viewRadio(page, "Both").click();
    await waitForLayout(page);
    await expectAxeClean(page);

    await loadMailroom(page);
    await viewRadio(page, "After").click();
    await waitForLayout(page);
    await expectAxeClean(page);
  });

  test("reduced-motion removal is immediate (AQ-05, CX-06)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await loadOakPark(page);
    await page.getByText("Write BS&A Software").first().click();
    await page.keyboard.press("Delete");
    await expect(page.getByText("Write BS&A Software")).toHaveCount(0);
    await expect(page.getByText("Review BS&A Software").first()).toBeVisible();
    await waitForLayout(page);
    await screenshotBoard(page, `${EVIDENCE}/reduced-motion-restitch-1440.png`);
  });
});
