import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { waitForLayout, capturePage } from "./ready";

const DEMO_STEP = "Read invoice.pdf";
const EVIDENCE = ".docs/evidence/08-shell";

async function loadDemo(page: Page) {
  await page.goto("/");
  await expect(page.getByText(DEMO_STEP).first()).toBeVisible({ timeout: 15_000 });
  await waitForLayout(page);
}

function viewRadio(page: Page, name: "Before" | "After" | "Compare") {
  return page.getByRole("radio", { name, exact: true });
}

test.describe("slice 8 shell, typography, and sound", () => {
  test("chunky Before/After/Both, sound off by default, Present hides inspector and restore", async ({
    page,
  }) => {
    await loadDemo(page);
    await expect(page.getByRole("button", { name: "Sound off" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sound off" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(viewRadio(page, "Before")).toHaveAttribute("aria-checked", "true");

    await capturePage(page, `${EVIDENCE}/before-light-1440.png`);

    await page.getByText(DEMO_STEP).first().click();
    await expect(page.locator("aside").getByRole("button", { name: "Type Read" })).toBeVisible();

    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Present" }).click();
    await expect(page.locator("aside")).toHaveCount(0);
    await expect(page.getByText(/will become automated/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Add Step or Data" })).toHaveCount(
      0,
    );
    await capturePage(page, `${EVIDENCE}/present-light-1440.png`);

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("Space");
    await expect(viewRadio(page, "After")).toHaveAttribute("aria-checked", "true");

    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Exit present" }).click();
    await expect(page.locator("aside")).toBeVisible();
    await expect(viewRadio(page, "Before")).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("aside").getByRole("button", { name: "Type Read" })).toBeVisible();
  });

  test("sound toggle announces on and stays independent of reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await loadDemo(page);
    const toggle = page.getByRole("button", { name: "Sound off" });
    await toggle.click();
    await expect(page.getByRole("button", { name: "Sound on" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator('[aria-live="polite"]').getByText("Sound on", { exact: true })).toHaveCount(
      1,
    );
    await capturePage(page, `${EVIDENCE}/sound-on-1440.png`);
    await page.getByRole("button", { name: "Sound on" }).click();
    await expect(page.getByRole("button", { name: "Sound off" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("After, Both, hamburger, and long tile text clamp", async ({ page }) => {
    await loadDemo(page);
    await viewRadio(page, "After").click();
    await expect(viewRadio(page, "After")).toHaveAttribute("aria-checked", "true");
    await capturePage(page, `${EVIDENCE}/after-light-1440.png`);

    await viewRadio(page, "Compare").click();
    await expect(viewRadio(page, "Compare")).toHaveAttribute("aria-checked", "true");
    await expect(page.locator('.board-lane[data-lane="before"]')).toBeVisible();
    await expect(page.locator('.board-lane[data-lane="after"]')).toBeVisible();
    await capturePage(page, `${EVIDENCE}/both-light-1440.png`);

    await viewRadio(page, "Before").click();
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("menuitem", { name: "Present" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/hamburger-1440.png`);
    await page.keyboard.press("Escape");

    await page.getByText(DEMO_STEP).first().click();
    const target = page.locator("aside").getByLabel("Name");
    await target.fill(
      "invoice.pdf that must wrap then shrink then clamp with an ellipsis for NA-10",
    );
    const detail = page.locator("aside").getByLabel("Details");
    await detail.fill("BS&A Software lookup with a very long system note that should clamp");
    await expect(
      page.getByRole("group", {
        name: "Read invoice.pdf that must wrap then shrink then clamp with an ellipsis for NA-10",
      }),
    ).toBeVisible();
    await capturePage(page, `${EVIDENCE}/tile-text-clamp-1440.png`);
  });

  test("dark theme shell contrast and axe on the restyled view switch", async ({ page }) => {
    await loadDemo(page);
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "Dark mode" }).click();
    await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
    await capturePage(page, `${EVIDENCE}/before-dark-1440.png`);
    await viewRadio(page, "After").click();
    await capturePage(page, `${EVIDENCE}/after-dark-1440.png`);
    await viewRadio(page, "Compare").click();
    await capturePage(page, `${EVIDENCE}/both-dark-1440.png`);
    await viewRadio(page, "Before").click();

    const results = await new AxeBuilder({ page })
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

test.describe("supported min-width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("chunky shell remains usable at 1024 CSS pixels", async ({ page }) => {
    await loadDemo(page);
    await expect(viewRadio(page, "Before")).toBeVisible();
    await capturePage(page, `${EVIDENCE}/before-light-1024.png`);
  });
});
