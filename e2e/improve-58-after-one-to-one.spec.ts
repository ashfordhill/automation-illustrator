import { expect, test, type Page } from "@playwright/test";
import { capturePage, loadOakPark, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-58-after-one-to-one";

function viewLabel(page: Page, name: "Before" | "After" | "Compare") {
  return page.locator("header").getByText(name, { exact: true });
}

async function tileTransforms(page: Page) {
  return page.locator(".react-flow__node").evaluateAll((nodes) =>
    nodes
      .map((n) => {
        const el = n as HTMLElement;
        return { id: el.dataset.id ?? "", transform: el.style.transform };
      })
      .sort((a, b) => a.id.localeCompare(b.id)),
  );
}

test.describe("Improvement 58 — After is 1:1 with Before", () => {
  test("switching After keeps the same Tile positions", async ({ page }) => {
    await loadOakPark(page);
    const before = await tileTransforms(page);
    expect(before.length).toBeGreaterThan(4);
    await capturePage(page, `${EVIDENCE}/before-1440.png`);

    await viewLabel(page, "After").click();
    await expect(page.getByRole("radio", { name: "After", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await waitForLayout(page);
    const after = await tileTransforms(page);
    expect(after).toEqual(before);
    await expect(page.getByText("delivery receipt")).toHaveCount(0);
    await capturePage(page, `${EVIDENCE}/after-1440.png`);

    await viewLabel(page, "Before").click();
    await waitForLayout(page);
    expect(await tileTransforms(page)).toEqual(before);
  });
});

test.describe("Improvement 58 at 1024", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("After matches Before at the supported min width", async ({ page }) => {
    await loadOakPark(page);
    const before = await tileTransforms(page);
    await viewLabel(page, "After").click();
    await waitForLayout(page);
    expect(await tileTransforms(page)).toEqual(before);
    await capturePage(page, `${EVIDENCE}/after-1024.png`);
  });
});
