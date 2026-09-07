/**
 * Dedicated React Flow node for a merge group (MG-08).
 * Own measured box — not a StepNode wrapping MergedStepTile.
 */
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AssignmentLane, SelectionKind } from "../../workflow/catalogs";
import { useStore } from "../../state/store";
import { MergedStepTile } from "../tiles/MergedStepTile";
import { PathHostFrame } from "../controls/PathHostFrame";
import { findNode } from "../../workflow/selectors";
import { isStepNode, laneAssignments, type StepNodeDto } from "../../workflow/types";
import type { GroupInternals } from "../../state/projection";

export type MergeGroupNodeData = {
  lane?: AssignmentLane;
  node?: StepNodeDto;
  originId?: string;
  memberIds?: string[];
  supportingIds?: string[];
  internals?: GroupInternals;
  departing?: boolean;
};

export function MergeGroupNode({ id, selected, dragging, data }: NodeProps) {
  const payload = (data ?? {}) as MergeGroupNodeData;
  const lane = payload.lane ?? AssignmentLane.Before;
  const memberIds = payload.memberIds;
  const lookupId = memberIds?.[0] ?? payload.originId ?? id;
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
  const workflow = useStore((s) => s.workflow);
  const node = live && isStepNode(live) ? live : payload.node;
  const internals = payload.internals;
  if (!node || !internals) return null;
  const on = !!(storeOn || selected || focusId === id);
  return (
    <PathHostFrame id={id} selected={on} departing={!!departing}>
      <Handle type="target" position={Position.Left} />
      <MergedStepTile
        actor={actor}
        doc={workflow}
        internals={internals}
        selected={on && !departing}
        lifted={dragging}
      />
      <Handle type="source" position={Position.Right} />
    </PathHostFrame>
  );
}
