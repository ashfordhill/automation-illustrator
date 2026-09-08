/**
 * React Flow node for a Step tile (actor + task).
 * Lane in node.data chooses Before vs After assignment (actorFor).
 * After-only Steps are supplied via projection data.
 */
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AssignmentLane, SelectionKind } from "../../workflow/catalogs";
import { useStore } from "../../state/store";
import { StepTile } from "../tiles/StepTile";
import { PathHostFrame } from "../controls/PathHostFrame";
import { findNode } from "../../workflow/selectors";
import { isStepNode, laneAssignments, type StepNodeDto } from "../../workflow/types";

export type StepNodeData = {
  lane?: AssignmentLane;
  node?: StepNodeDto;
  projectedKind?: "base" | "extra";
  originId?: string;
  departing?: boolean;
};

export function StepNode({ id, selected, dragging, data }: NodeProps) {
  const payload = (data ?? {}) as StepNodeData;
  const lane = payload.lane ?? AssignmentLane.Before;
  const lookupId = payload.originId ?? id;
  const departing = useStore((s) => (s.departing?.node.id === id ? s.departing : null));
  const live = useStore((s) => {
    const found = findNode(s.workflow, lookupId);
    if (found) return found;
    return s.departing?.node.id === id ? s.departing.node : undefined;
  });
  const actor = useStore((s) => {
    if (departing?.actor) return departing.actor;
    const whoId = laneAssignments(s.workflow, lane)[lookupId];
    return s.workflow.actors.find((a) => a.id === whoId);
  });
  const focusId = useStore((s) => s.focusId);
  const storeOn = useStore(
    (s) => s.selected?.type === SelectionKind.Node && s.selected.id === id,
  );
  const node = live && isStepNode(live) ? live : payload.node;
  if (!node || !isStepNode(node)) return null;
  const on = !!(storeOn || selected || focusId === id);
  return (
    <PathHostFrame id={id} selected={on} departing={!!departing}>
      <Handle type="target" position={Position.Left} />
      <StepTile
        actor={actor}
        kind={node.stepKind}
        title={node.title}
        detail={node.detail}
        selected={on && !departing}
        lifted={dragging}
      />
      <Handle type="source" position={Position.Right} />
    </PathHostFrame>
  );
}
