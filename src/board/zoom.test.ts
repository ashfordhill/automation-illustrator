import { expect, test } from "vitest";
import {
  GRAPH_ISLAND_FRACTION,
  WHEEL_ZOOM_FACTOR,
  clampZoom,
  graphIsIsland,
  pointInPaddedBounds,
  shouldZoomTowardBounds,
  viewportZoomAround,
  wheelZoomFactor,
} from "./zoom";

test("one 100 px wheel notch multiplies zoom by ~1.08", () => {
  expect(wheelZoomFactor(-100)).toBeCloseTo(WHEEL_ZOOM_FACTOR, 8);
  expect(wheelZoomFactor(100)).toBeCloseTo(1 / WHEEL_ZOOM_FACTOR, 8);
});

test("line-mode three-line notch matches a 100 px notch", () => {
  expect(wheelZoomFactor(-3, 1)).toBeCloseTo(WHEEL_ZOOM_FACTOR, 8);
});

test("clampZoom stays in 0.2–2.5", () => {
  expect(clampZoom(0.05)).toBe(0.2);
  expect(clampZoom(4)).toBe(2.5);
  expect(clampZoom(1)).toBe(1);
});

test("shouldZoomTowardBounds: zoom out and pointer-on-Path stay cursor-centered", () => {
  expect(
    shouldZoomTowardBounds({
      zoomingIn: false,
      pointerOverNodeOrPath: false,
      pointerInPaddedBounds: false,
      graphIsland: true,
    }),
  ).toBe(false);
  expect(
    shouldZoomTowardBounds({
      zoomingIn: true,
      pointerOverNodeOrPath: true,
      pointerInPaddedBounds: false,
      graphIsland: true,
    }),
  ).toBe(false);
});

test("shouldZoomTowardBounds: empty paper or island graph zooms toward bounds", () => {
  expect(
    shouldZoomTowardBounds({
      zoomingIn: true,
      pointerOverNodeOrPath: false,
      pointerInPaddedBounds: false,
      graphIsland: false,
    }),
  ).toBe(true);
  expect(
    shouldZoomTowardBounds({
      zoomingIn: true,
      pointerOverNodeOrPath: false,
      pointerInPaddedBounds: true,
      graphIsland: true,
    }),
  ).toBe(true);
  expect(
    shouldZoomTowardBounds({
      zoomingIn: true,
      pointerOverNodeOrPath: false,
      pointerInPaddedBounds: true,
      graphIsland: false,
    }),
  ).toBe(false);
});

test("pointInPaddedBounds includes a 32 px pad", () => {
  const b = { x: 100, y: 50, w: 200, h: 80 };
  expect(pointInPaddedBounds({ x: 100, y: 50 }, b)).toBe(true);
  expect(pointInPaddedBounds({ x: 68, y: 50 }, b)).toBe(true);
  expect(pointInPaddedBounds({ x: 67, y: 50 }, b)).toBe(false);
});

test("graphIsIsland is true only when both axes are under the fraction", () => {
  const b = { x: 0, y: 0, w: 200, h: 100 };
  expect(graphIsIsland(b, 1, { width: 1000, height: 800 }, GRAPH_ISLAND_FRACTION)).toBe(true);
  expect(graphIsIsland(b, 3, { width: 400, height: 200 }, GRAPH_ISLAND_FRACTION)).toBe(false);
});

test("viewportZoomAround keeps the flow point under the client point", () => {
  const next = viewportZoomAround({
    paneLeft: 10,
    paneTop: 20,
    clientX: 110,
    clientY: 220,
    flowX: 50,
    flowY: 80,
    nextZoom: 2,
  });
  expect(next.x).toBe(110 - 10 - 100);
  expect(next.y).toBe(220 - 20 - 160);
  expect(next.zoom).toBe(2);
});
