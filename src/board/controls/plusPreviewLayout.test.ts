import { expect, test } from "vitest";
import {
  PREVIEW_OUT,
  PREVIEW_RADIUS,
  previewCenters,
} from "./plusPreviewLayout";

test("Step and Data sit on a short arc to the right of the rest +", () => {
  const [step, data] = previewCenters(100, 200, 2);
  expect(step).toBeTruthy();
  expect(data).toBeTruthy();
  expect(PREVIEW_OUT).toBe(0);
  const dx = step!.x - 100;
  expect(dx).toBeGreaterThan(80);
  expect(dx).toBeLessThan(100);
  expect(step!.x).toBe(data!.x);
  expect(data!.y - step!.y).toBeGreaterThan(85);
  expect(Math.hypot(dx, step!.y - 200)).toBeCloseTo(PREVIEW_RADIUS, 5);
});

test("After’s single Step preview sits on the +’s horizontal", () => {
  const [step] = previewCenters(40, 10, 1);
  expect(step).toEqual({ x: 40 + PREVIEW_RADIUS, y: 10 });
});

test("inbound fan mirrors Step and Data to the left of the rest +", () => {
  const [step, data] = previewCenters(100, 200, 2, true);
  expect(step).toBeTruthy();
  expect(data).toBeTruthy();
  expect(step!.x).toBeLessThan(100);
  expect(step!.x).toBe(data!.x);
  expect(100 - step!.x).toBeGreaterThan(80);
  expect(100 - step!.x).toBeLessThan(100);
});
