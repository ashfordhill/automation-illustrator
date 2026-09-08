import { expect, test } from "@playwright/test";
import { DEMO_STEP, capturePage, loadOakPark } from "./ready";

const EVIDENCE = ".docs/evidence/improve-17-read-book";

test.describe("Improvement 17 — Read Type is an open book", () => {
  test("Read tile and Type picker show a book, not a clipboard", async ({ page }) => {
    await loadOakPark(page);
    await page.getByText(DEMO_STEP).first().click();
    const typeRead = page.locator("aside").getByRole("button", { name: "Type Read" });
    await expect(typeRead).toHaveAttribute("aria-pressed", "true");
    const readSvg = typeRead.locator("svg");
    await expect(readSvg.locator("rect")).toHaveCount(0);
    await expect(readSvg.locator("path")).toHaveCount(7);
    await capturePage(page, `${EVIDENCE}/read-book-1440.png`);
  });
});
