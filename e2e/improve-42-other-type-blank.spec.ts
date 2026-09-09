import { expect, test } from "@playwright/test";
import { capturePage, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-42-other-type-blank";

function aside(page: import("@playwright/test").Page) {
  return page.locator("aside");
}

test.describe("Improvement 42 — Other Type key has no printed word", () => {
  test("Other is a tall unlabeled clipboard on the right", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("menuitem", { name: "New" }).click();
    await page.getByRole("button", { name: "Discard" }).click();
    await page.getByRole("button", { name: "Add Step" }).click();
    await waitForLayout(page);

    const other = aside(page).getByRole("button", { name: "Type Other" });
    const write = aside(page).getByRole("button", { name: "Type Write" });
    const call = aside(page).getByRole("button", { name: "Type Call" });
    await expect(other).toHaveAttribute("aria-pressed", "true");
    await expect(other.locator(".inspector-type-name")).toHaveCount(0);
    await expect(write.locator(".inspector-type-name")).toHaveText("Write");

    const otherBox = await other.boundingBox();
    const writeBox = await write.boundingBox();
    const callBox = await call.boundingBox();
    expect(otherBox && writeBox && callBox).toBeTruthy();
    expect(Math.abs(otherBox!.width - writeBox!.width)).toBeLessThan(3);
    expect(otherBox!.height).toBeGreaterThan(writeBox!.height * 2);
    expect(Math.abs(otherBox!.y - callBox!.y)).toBeLessThan(4);
    expect(Math.abs(otherBox!.y + otherBox!.height - (writeBox!.y + writeBox!.height))).toBeLessThan(4);

    const icon = other.locator(".inspector-type-icon");
    const iconBox = await icon.boundingBox();
    expect(iconBox).toBeTruthy();
    expect(iconBox!.height).toBeGreaterThanOrEqual(30);
    expect(iconBox!.height).toBeLessThanOrEqual(40);

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
    await expect(other.locator(".inspector-type-name")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/other-type-blank-1024.png`);
  });
});
