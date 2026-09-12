import { expect, test } from "vitest";
import {
  boardNeedsCover,
  canApplyFirstLayoutCamera,
  firstLayoutCentersAtCurrentZoom,
  layoutBoundsAreUsable,
  unionNodeBounds,
  viewportToCenterRect,
  viewportToFitRect,
} from "./firstLayoutCamera";

test("empty or unsettled layouts do not take the one-time camera", () => {
  expect(canApplyFirstLayoutCamera("initial", 1)).toBe(false);
  expect(canApplyFirstLayoutCamera("updating", 1)).toBe(false);
  expect(canApplyFirstLayoutCamera("ready", 0)).toBe(false);
  expect(canApplyFirstLayoutCamera("ready", 1)).toBe(true);
  expect(canApplyFirstLayoutCamera("ready", 8)).toBe(true);
});

test("cover the board until the first nonempty camera is applied", () => {
  expect(boardNeedsCover(0, false)).toBe(false);
  expect(boardNeedsCover(1, false)).toBe(true);
  expect(boardNeedsCover(8, false)).toBe(true);
  expect(boardNeedsCover(8, true)).toBe(false);
});

test("only a sole Tile keeps the current zoom instead of fitView zoom-in", () => {
  expect(firstLayoutCentersAtCurrentZoom(1)).toBe(true);
  expect(firstLayoutCentersAtCurrentZoom(0)).toBe(false);
  expect(firstLayoutCentersAtCurrentZoom(2)).toBe(false);
});

test("viewportToCenterRect places the rect center at the pane center", () => {
  const next = viewportToCenterRect({ width: 1000, height: 800 }, { x: 32, y: 32, w: 256, h: 160 }, 1);
  expect(next.zoom).toBe(1);
  expect(next.x + (32 + 128) * 1).toBeCloseTo(500, 8);
  expect(next.y + (32 + 80) * 1).toBeCloseTo(400, 8);
});

test("viewportToFitRect zooms a small rect in and a large rect out", () => {
  const pane = { width: 1000, height: 800 };
  const small = viewportToFitRect(pane, { x: 0, y: 0, w: 200, h: 80 }, 0.28);
  expect(small.zoom).toBeGreaterThan(1);
  expect(small.x + 100 * small.zoom).toBeCloseTo(500, 5);
  const wide = viewportToFitRect(pane, { x: 0, y: 0, w: 4000, h: 200 }, 0.28);
  expect(wide.zoom).toBeLessThan(1);
});

test("layoutBoundsAreUsable rejects empty New bounds", () => {
  expect(layoutBoundsAreUsable(undefined)).toBe(false);
  expect(layoutBoundsAreUsable({ x: 0, y: 0, w: 0, h: 0 })).toBe(false);
  expect(layoutBoundsAreUsable({ x: 32, y: 32, w: 256, h: 160 })).toBe(true);
});

test("unionNodeBounds is the node boxes, not padded ELK root", () => {
  expect(
    unionNodeBounds(
      { a: { x: 0, y: 0 }, b: { x: 150, y: 20 } },
      { a: { w: 100, h: 50 }, b: { w: 100, h: 50 } },
    ),
  ).toEqual({ x: 0, y: 0, w: 250, h: 70 });
  expect(unionNodeBounds({}, { a: { w: 100, h: 50 } })).toBeUndefined();
});
