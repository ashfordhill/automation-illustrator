import { expect, test } from "vitest";
import { WorkflowNodeKind } from "../../workflow/catalogs";
import { FIELD_H, FIELD_RX, FIELD_W, STEP_H, STEP_RX, STEP_W, nodeRadius } from "../layout/tileMetrics";
import { fallbackTileRect, scaleCornerRadius } from "./tileOverlay";

test("nodeRadius is Step 14 and Data 32", () => {
  expect(nodeRadius(WorkflowNodeKind.Step)).toBe(STEP_RX);
  expect(nodeRadius(WorkflowNodeKind.DataField)).toBe(FIELD_RX);
  expect(FIELD_RX).not.toBe(STEP_RX);
});

test("scaleCornerRadius follows viewport zoom", () => {
  expect(scaleCornerRadius(FIELD_RX, FIELD_W, FIELD_W)).toBe(FIELD_RX);
  expect(scaleCornerRadius(FIELD_RX, FIELD_W, FIELD_W / 2)).toBe(FIELD_RX / 2);
  expect(scaleCornerRadius(STEP_RX, STEP_W, STEP_W)).toBe(STEP_RX);
});

test("fallbackTileRect uses Data size and radius, not Step’s 14", () => {
  const data = fallbackTileRect({ right: 200, top: 40 }, WorkflowNodeKind.DataField);
  expect(data).toEqual({
    x: 200 - FIELD_W,
    y: 32,
    w: FIELD_W,
    h: FIELD_H,
    rx: FIELD_RX,
  });
  const step = fallbackTileRect({ right: 400, top: 10 }, WorkflowNodeKind.Step);
  expect(step.w).toBe(STEP_W);
  expect(step.h).toBe(STEP_H);
  expect(step.rx).toBe(STEP_RX);
});
