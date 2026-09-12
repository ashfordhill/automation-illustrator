import { expect, test } from "vitest";
import {
  DOTTED_PERIOD,
  lerpPolylines,
  orthogonalPolyline,
  pathLength,
  pointAtLength,
  polylineDrawSegments,
  polylineToSvg,
  resamplePolyline,
  svgDashPhase,
} from "./polyline";

test("pointAtLength walks bends", () => {
  const pts = [
    { x: 0, y: 10 },
    { x: 40, y: 10 },
    { x: 40, y: 80 },
  ];
  expect(pointAtLength(pts, 20)).toEqual({ x: 20, y: 10 });
  expect(pointAtLength(pts, 60)).toEqual({ x: 40, y: 30 });
  expect(pointAtLength(pts, 999)).toEqual({ x: 40, y: 80 });
});

test("orthogonalPolyline stays stepped", () => {
  const pts = orthogonalPolyline(0, 0, 100, 80);
  expect(pts[0]).toEqual({ x: 0, y: 0 });
  expect(pts[pts.length - 1]).toEqual({ x: 100, y: 80 });
  expect(pts.length).toBeGreaterThanOrEqual(3);
});

test("orthogonalPolyline jogs in y when flow is vertical", () => {
  const pts = orthogonalPolyline(0, 0, 80, 100, "y");
  expect(pts[0]).toEqual({ x: 0, y: 0 });
  expect(pts[pts.length - 1]).toEqual({ x: 80, y: 100 });
  expect(pts.some((p) => p.y !== 0 && p.y !== 100)).toBe(true);
  const aligned = orthogonalPolyline(40, 0, 40, 100, "y");
  expect(aligned).toEqual([
    { x: 40, y: 0 },
    { x: 40, y: 100 },
  ]);
});

test("resample and lerp keep endpoints", () => {
  const a = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
  ];
  const b = [
    { x: 0, y: 0 },
    { x: 0, y: 10 },
    { x: 10, y: 10 },
  ];
  const mid = lerpPolylines(a, b, 0.5);
  expect(mid[0]).toEqual({ x: 0, y: 0 });
  expect(mid[mid.length - 1]!.x).toBeCloseTo(10);
  expect(pathLength(resamplePolyline(a, 8))).toBeCloseTo(pathLength(a));
  expect(polylineToSvg(a)).toBe("M 0 0 L 10 0");
});

test("overlapping dotted segments share world dash phase so they stay gapped", () => {
  const trunk = polylineDrawSegments(
    [
      { x: 10, y: 40 },
      { x: 80, y: 40 },
    ],
    DOTTED_PERIOD,
  );
  const shorter = polylineDrawSegments(
    [
      { x: 40, y: 40 },
      { x: 80, y: 40 },
    ],
    DOTTED_PERIOD,
  );
  expect(trunk).toHaveLength(1);
  expect(shorter).toHaveLength(1);
  const at = 55;
  expect(
    svgDashPhase(at - trunk[0]!.x1, trunk[0]!.dashOffset, DOTTED_PERIOD),
  ).toBe(svgDashPhase(at - shorter[0]!.x1, shorter[0]!.dashOffset, DOTTED_PERIOD));
});
