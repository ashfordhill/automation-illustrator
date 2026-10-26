import ELK from "elkjs/lib/elk.bundled.js";
import { describe, expect, test } from "vitest";
import { BUILTIN_THEMES } from "../app/theme/chromeTheme";
import { createLayoutEngine } from "../board/layout/layoutEngine";
import { OAK_PARK_IDS, oakParkInvoice } from "../demos/oakParkInvoice";
import { robotMailroom } from "../demos/robotMailroom";
import { AssignmentLane } from "../workflow/catalogs";
import { isDataFieldNode, laneBoard, type WorkflowDoc } from "../workflow/types";
import { appearanceFor, DEFAULT_APPEARANCE } from "./appearance";
import { imageFilename, renderBoardImage, type ImageView } from "./exportImage";

const LENS = "#868e96";

function engine() {
  return createLayoutEngine(new ELK(), { debounceMs: 0 });
}

async function render(doc: WorkflowDoc, view: ImageView, appearance = DEFAULT_APPEARANCE) {
  const image = await renderBoardImage(doc, view, { appearance, engine: engine() });
  const xml = new DOMParser().parseFromString(image.svg, "image/svg+xml");
  return { image, xml };
}

function stepCount(doc: WorkflowDoc, lane: AssignmentLane) {
  return laneBoard(doc, lane).nodes.filter((n) => n.type === "step").length;
}

describe("renderBoardImage", () => {
  test("Compare is one well-formed SVG with both lanes and no unresolved color", async () => {
    const doc = oakParkInvoice();
    const { image, xml } = await render(doc, "compare");
    expect(xml.querySelector("parsererror")).toBeNull();
    const root = xml.documentElement;
    expect(root.getAttribute("width")).toBe(String(image.width));
    expect(root.getAttribute("height")).toBe(String(image.height));
    expect(root.getAttribute("viewBox")).toBe(`0 0 ${image.width} ${image.height}`);
    expect(xml.querySelector("title")?.textContent).toBe("Oak Park Invoice — Compare");
    expect(image.svg).not.toMatch(/var\(--/);
    expect(image.svg).toContain("data:font/woff2;base64,");
    const texts = [...xml.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toContain("Before");
    expect(texts).toContain("After");
    expect(texts).toContain("invoice > $50,000");
    expect(xml.querySelectorAll("clipPath")).toHaveLength(
      stepCount(doc, AssignmentLane.Before) + stepCount(doc, AssignmentLane.After),
    );
    expect(xml.querySelectorAll('[stroke-dasharray="8 7"]').length).toBeGreaterThan(0);
  });

  test("Compare stacks lanes for horizontal flow and sets them side by side for vertical", async () => {
    const doc = oakParkInvoice();
    const one = (await render(doc, "before")).image;
    const stacked = (await render(doc, "compare")).image;
    expect(stacked.width).toBe(one.width);
    expect(stacked.height).toBeGreaterThan(one.height * 1.9);

    const vertical = appearanceFor("vertical", DEFAULT_APPEARANCE.theme);
    const tall = (await render(doc, "before", vertical)).image;
    const sideBySide = (await render(doc, "compare", vertical)).image;
    expect(tall.height).toBeGreaterThan(tall.width);
    expect(sideBySide.height).toBe(tall.height);
    expect(sideBySide.width).toBeGreaterThan(tall.width * 1.9);
  });

  test("each lane wears its own look and Data color", async () => {
    const doc = oakParkInvoice();
    doc.after = { ...doc.after, looks: { [OAK_PARK_IDS.roy]: { accessories: ["sunglasses"] } } };
    const fork = doc.after.fork!;
    const acct = fork.nodes.find((n) => n.id === OAK_PARK_IDS.acct);
    if (!acct || !isDataFieldNode(acct)) throw new Error("missing After Data");
    acct.color = "#d65db1";
    const before = (await render(doc, "before")).image.svg;
    const after = (await render(doc, "after")).image.svg;
    expect(before).not.toContain(LENS);
    expect(after).toContain(LENS);
    expect(before).not.toContain("#d65db1");
    expect(after).toContain("#d65db1");
  });

  test("the theme paints the paper and texture", async () => {
    const forest = BUILTIN_THEMES.find((t) => t.id === "forest")!;
    const { xml } = await render(robotMailroom(), "after", appearanceFor("horizontal", forest));
    const paper = xml.querySelector("svg > rect");
    expect(paper?.getAttribute("fill")).toBe(forest.colors.paper);
    const pattern = xml.querySelector("pattern#paper-texture");
    expect(pattern?.innerHTML).toContain(forest.texture.color);
    expect(pattern?.querySelector("path")).not.toBeNull();
  });

  test("an empty board still renders captions on plain paper", async () => {
    const empty: WorkflowDoc = { ...oakParkInvoice(), nodes: [], edges: [], assignments: {} };
    empty.after = { ...empty.after, fork: null };
    const { image, xml } = await render(empty, "compare");
    expect(xml.querySelector("parsererror")).toBeNull();
    expect(xml.querySelectorAll("clipPath")).toHaveLength(0);
    expect(image.width).toBeGreaterThan(300);
  });
});

test("image filenames follow the workflow slug and view", () => {
  const doc = oakParkInvoice();
  expect(imageFilename(doc, "compare", "svg")).toBe("oak-park-invoice.svg");
  expect(imageFilename(doc, "before", "png")).toBe("oak-park-invoice.before.png");
  expect(imageFilename(doc, "after", "svg")).toBe("oak-park-invoice.after.svg");
  expect(imageFilename({ name: " " }, "compare", "png")).toBe("untitled.png");
});
