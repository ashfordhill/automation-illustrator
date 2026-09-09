/**
 * Dock new forks on the source row, then further along the axis (Improvement 36).
 */
import { expect, test } from "vitest";
import { WorkflowNodeKind } from "../../workflow/catalogs";
import { BRANCH_GAP, STEP_H, STEP_W, TILE_GAP, clearDockPosition, dockPosition, withDisplayedPositions } from "./tileMetrics";

const roy = { position: { x: 569, y: 32 }, type: WorkflowNodeKind.Step };
const read = { position: { x: 32, y: 128 }, type: WorkflowNodeKind.Step };
const alice = { position: { x: 569, y: 224 }, type: WorkflowNodeKind.Step };

test("inbound fork stays on the source row and walks left past overlaps", () => {
  const pos = clearDockPosition(roy, WorkflowNodeKind.Step, 1, [read, roy, alice], "in");
  expect(pos.y).toBe(roy.position.y);
  expect(pos.x).toBeLessThan(roy.position.x);
  expect(pos.x + STEP_W).toBeLessThanOrEqual(read.position.x + 1);
});

test("first inbound on an empty-left tile uses the adjacent column, same row", () => {
  const pos = clearDockPosition(roy, WorkflowNodeKind.Step, 0, [roy], "in");
  expect(pos).toEqual(dockPosition(roy, WorkflowNodeKind.Step, 0, "in"));
  expect(pos.y).toBe(roy.position.y);
});

test("outbound fork stays on the source row when the adjacent slot is free", () => {
  const pos = clearDockPosition(roy, WorkflowNodeKind.Step, 1, [roy], "out");
  expect(pos).toEqual(dockPosition(roy, WorkflowNodeKind.Step, 0, "out"));
});

test("withDisplayedPositions overlays ELK coordinates by id", () => {
  const nodes = withDisplayedPositions(
    [{ id: "s_web", position: { x: 0, y: 0 }, type: WorkflowNodeKind.Step }],
    { s_web: { x: 569, y: 32 } },
  );
  expect(nodes[0]!.position).toEqual({ x: 569, y: 32 });
});

test("stacked fallback still has a vertical stride of one tile plus branch gap", () => {
  const blocker = {
    position: { x: roy.position.x + STEP_W + TILE_GAP, y: roy.position.y },
    type: WorkflowNodeKind.Step,
  };
  const further = {
    position: { x: blocker.position.x + STEP_W + TILE_GAP, y: roy.position.y },
    type: WorkflowNodeKind.Step,
  };
  // Fill same-row outward slots so we drop to stacking.
  const others = [roy, blocker, further];
  for (let col = 2; col < 40; col++) {
    others.push({
      position: { x: roy.position.x + STEP_W + TILE_GAP + col * (STEP_W + TILE_GAP), y: roy.position.y },
      type: WorkflowNodeKind.Step,
    });
  }
  const pos = clearDockPosition(roy, WorkflowNodeKind.Step, 1, others, "out");
  expect(pos.y).toBeGreaterThanOrEqual(roy.position.y + STEP_H + BRANCH_GAP - 1);
});
