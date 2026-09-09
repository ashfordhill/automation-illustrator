/**
 * Branch-row stability when forking (Improvement 36).
 */
import ELK from "elkjs/lib/elk.bundled.js";
import { expect, test } from "vitest";
import { oakParkInvoice, OAK_PARK_IDS } from "../../demos/oakParkInvoice";
import { projectBefore, type LaneProjection } from "../../state/projection";
import { SplitKind, StepKind, WorkflowNodeKind } from "../../workflow/catalogs";
import { addConnectedNode } from "../../workflow/commands";
import type { PositionMap, WorkflowDoc } from "../../workflow/types";
import { buildElkGraph, laneGraphKey, usedOptionIds } from "./elkGraph";
import { toLaneLayout } from "./elkLayout";
import { measureLabelBox, type LabelBox } from "./labelBox";
import type { LaneLayout } from "./laneLayout";
import { STEP_W, TILE_GAP } from "./tileMetrics";

const elk = new ELK();

function boxesFor(projection: LaneProjection): Record<string, LabelBox> {
  const boxes: Record<string, LabelBox> = {};
  for (const e of projection.edges) if (e.label.trim()) boxes[e.id] = measureLabelBox(e.label);
  return boxes;
}

async function layoutOf(projection: LaneProjection, previous?: PositionMap): Promise<LaneLayout> {
  const boxes = boxesFor(projection);
  const key = laneGraphKey(projection, boxes);
  const laidOut = await elk.layout(buildElkGraph(projection, boxes, undefined, previous));
  return toLaneLayout(key, laidOut);
}

function forkPredecessor(doc: WorkflowDoc, ontoId: string, previous: PositionMap): WorkflowDoc {
  const host = previous[ontoId] ?? { x: 0, y: 0 };
  const result = addConnectedNode(
    doc,
    ontoId,
    {
      id: "s_new",
      type: WorkflowNodeKind.Step,
      position: { x: host.x - STEP_W - TILE_GAP, y: host.y },
      stepKind: StepKind.Other,
      title: "Task",
      detail: "",
      split: SplitKind.Exclusive,
    },
    { inbound: true },
  );
  if (!result.ok) throw new Error(result.message);
  return result.value;
}

test("stability options are known to ELK", async () => {
  const known = new Set(
    (await elk.knownLayoutOptions()).map((o) => (o.id ?? "").replace(/^org\.eclipse\.elk\./, "elk.")),
  );
  for (const id of usedOptionIds()) expect(known.has(id), id).toBe(true);
});

test("left fork on Search website keeps that row above filesystem", async () => {
  const doc = oakParkInvoice();
  const before = await layoutOf(projectBefore(doc));
  expect(before.positions[OAK_PARK_IDS.web]!.y).toBeLessThan(before.positions[OAK_PARK_IDS.fs]!.y);

  const nextDoc = forkPredecessor(doc, OAK_PARK_IDS.web, before.positions);
  const after = await layoutOf(projectBefore(nextDoc), before.positions);

  expect(after.positions[OAK_PARK_IDS.web]!.y).toBeLessThan(after.positions[OAK_PARK_IDS.fs]!.y);
  expect(after.positions.s_new!.y).toBeLessThan(after.positions[OAK_PARK_IDS.fs]!.y);
  expect(after.positions.s_new!.x).toBeLessThan(after.positions[OAK_PARK_IDS.web]!.x);
  expect(Math.abs(after.positions.s_new!.y - after.positions[OAK_PARK_IDS.web]!.y)).toBeLessThanOrEqual(32);
});

test("left fork on Search filesystem keeps website above filesystem", async () => {
  const doc = oakParkInvoice();
  const before = await layoutOf(projectBefore(doc));
  const nextDoc = forkPredecessor(doc, OAK_PARK_IDS.fs, before.positions);
  const after = await layoutOf(projectBefore(nextDoc), before.positions);

  expect(after.positions[OAK_PARK_IDS.web]!.y).toBeLessThan(after.positions[OAK_PARK_IDS.fs]!.y);
  expect(after.positions.s_new!.y).toBeGreaterThan(after.positions[OAK_PARK_IDS.web]!.y);
});
