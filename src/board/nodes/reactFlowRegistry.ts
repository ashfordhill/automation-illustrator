/**
 * React Flow node/edge type registries and the Before/After lane type.
 * Board.tsx passes these into <ReactFlow>; keep RF `"field"` vs document `dataField` here.
 */
import { ReactFlowEdgeKind, ReactFlowNodeKind, type AssignmentLane } from "../../workflow/catalogs";
import { DataFieldNode } from "./DataFieldNode";
import { MergeGroupNode } from "./MergeGroupNode";
import { FlowArrow } from "../routing/FlowArrow";
import { StepNode } from "./StepNode";

export const nodeTypes = {
  [ReactFlowNodeKind.Step]: StepNode,
  [ReactFlowNodeKind.DataField]: DataFieldNode,
  [ReactFlowNodeKind.MergeGroup]: MergeGroupNode,
};

export const edgeTypes = {
  [ReactFlowEdgeKind.Flow]: FlowArrow,
};

/** Which assignment map a Board instance shows — Both view mounts two Boards. */
export type Lane = AssignmentLane;
