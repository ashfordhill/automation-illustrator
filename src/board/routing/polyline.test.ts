import { expect, test } from "vitest";
import {
  lerpPolylines,
  orthogonalPolyline,
  pathLength,
  pointAtLength,
  polylineToSvg,
  resamplePolyline,
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
