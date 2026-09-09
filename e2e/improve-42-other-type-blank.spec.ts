import { expect, test } from "@playwright/test";
import { capturePage, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-42-other-type-blank";

function aside(page: import("@playwright/test").Page) {
  return page.locator("aside");
}

test.describe("Improvement 42 — Other Type key has no printed word", () => {
  test("Other is clipboard-only and matches Write’s key size", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "New" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await page.getByRole("button", { name: "Add Step" }).click();
    await waitForLayout(page);

    const other = aside(page).getByRole("button", { name: "Type Other" });
    const write = aside(page).getByRole("button", { name: "Type Write" });
    await expect(other).toHaveAttribute("aria-pressed", "true");
    await expect(other.locator(".inspector-type-name")).not.toHaveText("Other");
    await expect(write.locator(".inspector-type-name")).toHaveText("Write");

    const otherBox = await other.boundingBox();
    const writeBox = await write.boundingBox();
    expect(otherBox && writeBox).toBeTruthy();
    expect(Math.abs(otherBox!.height - writeBox!.height)).toBeLessThan(2);
    expect(Math.abs(otherBox!.width - writeBox!.width)).toBeLessThan(2);

    const icon = other.locator(".inspector-type-icon");
    const iconBox = await icon.boundingBox();
    expect(iconBox).toBeTruthy();
    expect(iconBox!.height).toBeGreaterThanOrEqual(20);
    expect(iconBox!.height).toBeLessThanOrEqual(24);

    await capturePage(page, `${EVIDENCE}/other-type-blank-1440.png`);
  });
});

test.describe("Improvement 42 — min width", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("Other stays unlabeled at 1024", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "New" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await page.getByRole("button", { name: "Add Step" }).click();
    await waitForLayout(page);
    const other = aside(page).getByRole("button", { name: "Type Other" });
    await expect(other.locator(".inspector-type-name")).not.toHaveText("Other");
    await capturePage(page, `${EVIDENCE}/other-type-blank-1024.png`);
  });
});
