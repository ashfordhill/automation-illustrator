import ELK from "elkjs/lib/elk.bundled.js";
import { expect, test } from "vitest";
import { projectBefore } from "../../state/projection";
import {
  SplitKind,
  StepKind,
  WORKFLOW_VERSION,
  WorkflowNodeKind,
} from "../../workflow/catalogs";
import type { WorkflowDoc } from "../../workflow/types";
import { buildElkGraph, laneGraphKey, WEB_LAYER_GAP } from "../layout/elkGraph";
import { toLaneLayout } from "../layout/elkLayout";
import { wordWebNodeSize } from "./headline";

const elk = new ELK();

function twoStepDoc(): WorkflowDoc {
  return {
    version: WORKFLOW_VERSION,
    actors: [],
    nodes: [
      {
        id: "s_a",
        type: WorkflowNodeKind.Step,
        position: { x: 0, y: 0 },
        stepKind: StepKind.Read,
        title: "invoice.pdf",
        detail: "",
        split: SplitKind.Parallel,
      },
      {
        id: "s_b",
        type: WorkflowNodeKind.Step,
        position: { x: 400, y: 0 },
        stepKind: StepKind.Write,
        title: "amount",
        detail: "",
        split: SplitKind.Parallel,
      },
    ],
    edges: [{ id: "e_ab", source: "s_a", target: "s_b", label: "always" }],
    assignments: {},
    after: { assignments: {}, groups: [], extraNodes: [], extraEdges: [] },
  };
}

test("laneGraphKey includes web mode so tile and web caches do not collide", () => {
  const projection = projectBefore(twoStepDoc());
  const tile = laneGraphKey(projection, {});
  const web = laneGraphKey(projection, {}, undefined, "web");
  expect(tile.startsWith("tile|")).toBe(true);
  expect(web.startsWith("web|")).toBe(true);
  expect(web).not.toBe(tile);
});

test("two-node word-web chain keeps a layer gap of at least 160", async () => {
  const projection = projectBefore(twoStepDoc());
  const sizes = Object.fromEntries(projection.nodes.map((n) => [n.id, wordWebNodeSize(n)]));
  const key = laneGraphKey(projection, {}, sizes, "web");
  const laidOut = await elk.layout(buildElkGraph(projection, {}, sizes, undefined, "web"));
  const layout = toLaneLayout(key, laidOut);
  const a = layout.positions.s_a!;
  const b = layout.positions.s_b!;
  const wa = sizes.s_a!.w;
  const wb = sizes.s_b!.w;
  const gap = b.x - (a.x + wa);
  expect(gap).toBeGreaterThanOrEqual(WEB_LAYER_GAP - 2);
  const centerDist = b.x + wb / 2 - (a.x + wa / 2);
  expect(centerDist).toBeGreaterThanOrEqual((wa + wb) / 2 + WEB_LAYER_GAP - 2);
});
