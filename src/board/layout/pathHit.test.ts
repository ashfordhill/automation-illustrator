import { expect, test } from "vitest";
import { distToPolyline, hitPathId } from "./pathHit";
import type { LaneLayout } from "./laneLayout";

test("hitPathId returns the closest route within the threshold", () => {
  const layout: LaneLayout = {
    key: "test",
    positions: {},
    routes: {
      e1: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
      e2: [
        { x: 0, y: 40 },
        { x: 100, y: 40 },
      ],
    },
    labels: {},
    bounds: { x: 0, y: 0, w: 100, h: 40 },
  };
  expect(distToPolyline({ x: 50, y: 4 }, layout.routes.e1!)).toBeLessThan(5);
  expect(hitPathId(layout, { x: 50, y: 3 }, () => false)).toBe("e1");
  expect(hitPathId(layout, { x: 50, y: 38 }, () => false)).toBe("e2");
  expect(hitPathId(layout, { x: 50, y: 200 }, () => false)).toBeNull();
  expect(hitPathId(layout, { x: 50, y: 3 }, (id) => id === "e1")).toBeNull();
});
