import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { BUILTIN_THEMES } from "../src/app/theme/chromeTheme";
import { loadOakPark } from "./ready";

const EVIDENCE = ".docs/evidence/improve-68-export-image";
const OAK_PARK_YAML = readFileSync("src/demos/oak-park-invoice.yaml", "utf8");
const FOREST = BUILTIN_THEMES.find((t) => t.id === "forest")!;

type Rendered = {
  ok: boolean;
  message?: string;
  name?: string;
  appearance?: { orientation: string; theme: { name: string } };
  images?: { view: string; width: number; height: number; svg?: string; png?: string }[];
};

async function exportedFile(page: Page): Promise<string> {
  await loadOakPark(page);
  await page.getByRole("button", { name: "Menu" }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export", exact: true }).click();
  return readFileSync((await (await pending).path())!, "utf8");
}

async function render(page: Page, text: string, request: Record<string, unknown> = {}): Promise<Rendered> {
  await page.goto("/render.html");
  await expect(page.locator("html")).toHaveAttribute("data-render-ready", "true");
  return page.evaluate(
    ([t, r]) => (window as unknown as { illustratorRender: (a: string, b: unknown) => Promise<Rendered> }).illustratorRender(t, r),
    [text, request] as const,
  );
}

test.describe("Improvement 68 render page", () => {
  test("an exported file renders every view in the look its header records", async ({ page }) => {
    const file = JSON.parse(await exportedFile(page)) as Record<string, unknown>;
    expect(file.appearance).toMatchObject({ orientation: "horizontal", theme: { name: "Ice" } });
    file.appearance = {
      orientation: "vertical",
      theme: { name: FOREST.name, colors: FOREST.colors, texture: FOREST.texture },
    };
    const result = await render(page, JSON.stringify(file), { formats: ["svg", "png"] });
    expect(result.ok).toBe(true);
    expect(result.name).toBe("Oak Park Invoice");
    expect(result.appearance).toMatchObject({ orientation: "vertical", theme: { name: "Forest" } });
    expect(result.images!.map((i) => i.view)).toEqual(["compare", "before", "after"]);
    const [compare, before] = result.images!;
    expect(compare!.width).toBeGreaterThan(before!.width * 1.9);
    expect(compare!.height).toBe(before!.height);
    expect(compare!.svg).toContain(`fill="${FOREST.colors.paper}"`);
    expect(Buffer.from(compare!.png!, "base64").subarray(1, 4).toString()).toBe("PNG");

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.setContent(
      `<body style="margin:0;display:grid;place-items:center;height:100vh;background:#fff">` +
        `<img style="max-width:1400px;max-height:860px" src="data:image/svg+xml;base64,${Buffer.from(compare!.svg!).toString("base64")}"></body>`,
    );
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${EVIDENCE}/render-compare-vertical-forest-1440.png` });
  });

  test("a headerless YAML file renders in horizontal Ice; one view and format on request", async ({ page }) => {
    const result = await render(page, OAK_PARK_YAML, { views: ["after"], formats: ["png"] });
    expect(result.ok).toBe(true);
    expect(result.appearance).toMatchObject({ orientation: "horizontal", theme: { name: "Ice" } });
    expect(result.images).toHaveLength(1);
    expect(result.images![0]).toMatchObject({ view: "after" });
    expect(result.images![0]!.svg).toBeUndefined();
    expect(result.images![0]!.png?.length).toBeGreaterThan(1000);
  });

  test("bad input is refused with the Import message", async ({ page }) => {
    expect(await render(page, "{")).toEqual({ ok: false, message: "This file is not valid YAML or JSON." });
    const excalidraw = await render(page, JSON.stringify({ type: "excalidraw", version: 2, elements: [] }));
    expect(excalidraw).toEqual({ ok: false, message: "This file is not an Automation Illustrator workflow." });
  });
});
