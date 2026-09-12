import { expect, test, type Page } from "@playwright/test";
import { waitForLayout, capturePage } from "./ready";

const DEMO_STEP = "Read invoice.pdf";
const MAIL_STEP = "Read incoming mail";
const EVIDENCE = ".docs/evidence/05-replace";

async function loadDemo(page: Page) {
  await page.goto("/");
  await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
  await waitForLayout(page);
}

function viewLabel(page: Page, name: "Before" | "After" | "Compare") {
  return page.locator("header").getByRole("radio", { name, exact: true });
}

async function openMenu(page: Page) {
  await page.getByRole("button", { name: "Menu" }).click();
}

test.describe("slice 5 replacement and demos", () => {
  test("Oak Park still loads; hamburger Demo chooser is at the bottom", async ({ page }) => {
    await loadDemo(page);
    await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/before-light-1440.png`);

    await viewLabel(page, "After").click();
    await expect(page.getByRole("radio", { name: "After", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await capturePage(page, `${EVIDENCE}/after-light-1440.png`);

    await viewLabel(page, "Compare").click();
    await expect(page.getByRole("radio", { name: "Compare", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator('.board-lane[data-lane="before"]')).toBeVisible();
    await expect(page.locator('.board-lane[data-lane="after"]')).toBeVisible();
    await capturePage(page, `${EVIDENCE}/both-light-1440.png`);

    await viewLabel(page, "Before").click();
    await openMenu(page);
    await expect(page.getByRole("menuitem", { name: "New" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "New" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Import" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Export" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Oak Park Invoice" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Robot Mailroom" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Demo", exact: true })).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/hamburger-1440.png`);
  });

  test("Cancel leaves the current board unchanged", async ({ page }) => {
    await loadDemo(page);
    await openMenu(page);
    await page.getByRole("menuitem", { name: "New" }).click();
    await expect(page.getByRole("dialog", { name: "Start a new board?" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/replace-gate-1440.png`);
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();
  });

  test("Discard New shows Add Step; Add Step creates the root", async ({ page }) => {
    await loadDemo(page);
    await openMenu(page);
    await page.getByRole("menuitem", { name: "New" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await expect(page.getByText("This board is empty.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Step" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Data" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/empty-new-1440.png`);
    await page.getByRole("button", { name: "Add Step" }).click();
    await expect(page.getByText("This board is empty.")).toHaveCount(0);
    await expect(page.locator("aside").getByRole("button", { name: "Type Other" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("Save copy downloads YAML then loads Robot Mailroom", async ({ page }) => {
    await loadDemo(page);
    await openMenu(page);
    await page.getByRole("menuitem", { name: "Robot Mailroom" }).click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save copy" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("oak-park-invoice.yaml");
    await expect(page.getByText(MAIL_STEP).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(DEMO_STEP)).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/robot-mailroom-1440.png`);
  });

  test("invalid import does not replace the live board", async ({ page }) => {
    await loadDemo(page);
    await page.setInputFiles('input[type="file"]', {
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from("{"),
    });
    await expect(page.getByRole("dialog", { name: "Could not import" })).toBeVisible();
    await page.getByRole("button", { name: "OK" }).click();
    await expect(page.getByText(DEMO_STEP).first()).toBeVisible();
  });
});

test.describe("recovery UI", () => {
  test("corrupt storage offers Download recovery copy and Start fresh", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("automation-pitch.workflow", '{"version":1');
    });
    await page.goto("/");
    await expect(page.getByRole("dialog", { name: "Could not load the saved board" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Download recovery copy" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start fresh" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/recovery-1440.png`);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download recovery copy" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("automation-pitch.recovery.json");

    await page.getByRole("button", { name: "Start fresh" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Add Step" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Data" })).toBeVisible();
  });
});

test.describe("supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("demo board is usable at 1024 CSS pixels", async ({ page }) => {
    await loadDemo(page);
    await expect(viewLabel(page, "Before")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/before-light-1024.png`);
  });
});
