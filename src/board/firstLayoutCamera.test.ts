import { expect, test } from "vitest";
import {
  canApplyFirstLayoutCamera,
  firstLayoutCentersAtCurrentZoom,
  layoutBoundsAreUsable,
  viewportToCenterRect,
} from "./firstLayoutCamera";

test("empty or unsettled layouts do not take the one-time camera", () => {
  expect(canApplyFirstLayoutCamera("initial", 1)).toBe(false);
  expect(canApplyFirstLayoutCamera("updating", 1)).toBe(false);
  expect(canApplyFirstLayoutCamera("ready", 0)).toBe(false);
  expect(canApplyFirstLayoutCamera("ready", 1)).toBe(true);
  expect(canApplyFirstLayoutCamera("ready", 8)).toBe(true);
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

test("layoutBoundsAreUsable rejects empty New bounds", () => {
  expect(layoutBoundsAreUsable(undefined)).toBe(false);
  expect(layoutBoundsAreUsable({ x: 0, y: 0, w: 0, h: 0 })).toBe(false);
  expect(layoutBoundsAreUsable({ x: 32, y: 32, w: 256, h: 160 })).toBe(true);
});
