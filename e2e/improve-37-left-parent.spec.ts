import { expect, test, type Page } from "@playwright/test";
import { loadOakPark, screenshotBoard, waitForLayout } from "./ready";

const EVIDENCE = ".docs/evidence/improve-37-left-parent";

function aside(page: Page) {
  return page.locator("aside");
}

async function persistedDoc(page: Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem("automation-pitch.workflow");
    if (!raw) return { edges: [] as { source: string; target: string }[], assignments: {} as Record<string, string> };
    const doc = JSON.parse(raw) as {
      edges: { source: string; target: string; label: string }[];
      assignments: Record<string, string>;
    };
    return { edges: doc.edges, assignments: doc.assignments };
  });
}

test.describe("Improvement 37 — left spawn is a parent, not a fork", () => {
  test("Q on Roy’s Search website inserts a Roy parent in the chain", async ({ page }) => {
    await loadOakPark(page);
    const web = page.locator('.react-flow__node[data-id="s_web"]');
    await web.click();
    await aside(page).getByRole("button", { name: "Who Roy" }).click();
    await expect(aside(page).getByRole("button", { name: "Who Roy" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.keyboard.press("q");
    await waitForLayout(page);
    await expect(page.locator(".react-flow__node")).toHaveCount(9);

    const created = page.locator(".react-flow__node.selected");
    await expect(created).toHaveCount(1);
    await expect(aside(page).getByRole("button", { name: "Who Roy" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    const extraBox = await created.boundingBox();
    const afterWeb = await web.boundingBox();
    expect(extraBox).toBeTruthy();
    expect(afterWeb).toBeTruthy();
    expect(extraBox!.x).toBeLessThan(afterWeb!.x);

    const saved = await persistedDoc(page);
    expect(saved.edges.some((e) => e.source === "s_read" && e.target === "s_web")).toBe(false);
    expect(saved.edges.some((e) => e.source === "s_read" && e.target === "s_fs")).toBe(true);
    const intoWeb = saved.edges.filter((e) => e.target === "s_web");
    expect(intoWeb).toHaveLength(1);
    expect(intoWeb[0]!.source).not.toBe("s_read");
    expect(saved.edges.some((e) => e.source === "s_read" && e.target === intoWeb[0]!.source)).toBe(
      true,
    );
    expect(saved.assignments[intoWeb[0]!.source]).toBe(saved.assignments.s_web);

    await screenshotBoard(page, `${EVIDENCE}/left-parent-roy-1440.png`);
  });

  test("E on Search website still forks a child to the right", async ({ page }) => {
    await loadOakPark(page);
    await page.locator('.react-flow__node[data-id="s_web"]').click();
    await page.keyboard.press("e");
    await waitForLayout(page);
    const saved = await persistedDoc(page);
    expect(saved.edges.some((e) => e.source === "s_read" && e.target === "s_web")).toBe(true);
    const fromWeb = saved.edges.filter((e) => e.source === "s_web");
    expect(fromWeb.length).toBeGreaterThan(1);
    await screenshotBoard(page, `${EVIDENCE}/right-fork-website-1440.png`);
  });

  test("left parent at 1024 keeps Roy’s Who", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await loadOakPark(page);
    await page.locator('.react-flow__node[data-id="s_web"]').click();
    await aside(page).getByRole("button", { name: "Who Roy" }).click();
    await page.keyboard.press("q");
    await waitForLayout(page);
    await expect(aside(page).getByRole("button", { name: "Who Roy" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const saved = await persistedDoc(page);
    expect(saved.edges.some((e) => e.source === "s_read" && e.target === "s_web")).toBe(false);
    await screenshotBoard(page, `${EVIDENCE}/left-parent-roy-1024.png`);
  });
});
