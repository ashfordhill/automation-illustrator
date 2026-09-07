/**
 * React Flow node for a Step tile (actor + task).
 * Lane in node.data chooses Before vs After assignment (actorFor).
 * After-only Steps and merge-group tiles are supplied via projection data.
 */
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AssignmentLane, SelectionKind } from "../../workflow/catalogs";
import { useStore } from "../../state/store";
import { StepTile } from "../tiles/StepTile";
import { MergedStepTile } from "../tiles/MergedStepTile";
import { PathHostFrame } from "../controls/PathHostFrame";
import { findNode } from "../../workflow/selectors";
import { isStepNode, laneAssignments, type StepNodeDto } from "../../workflow/types";
import type { GroupInternals } from "../../state/projection";

export type StepNodeData = {
  lane?: AssignmentLane;
  node?: StepNodeDto;
  projectedKind?: "base" | "extra" | "group";
  originId?: string;
  memberIds?: string[];
  supportingIds?: string[];
  internals?: GroupInternals;
  departing?: boolean;
};

export function StepNode({ id, selected, dragging, data }: NodeProps) {
  const payload = (data ?? {}) as StepNodeData;
  const lane = payload.lane ?? AssignmentLane.Before;
  const memberIds = payload.memberIds;
  const lookupId =
    payload.projectedKind === "group" ? (memberIds?.[0] ?? payload.originId ?? id) : (payload.originId ?? id);
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
  if (!node || !isStepNode(node)) return null;
  const on = !!(storeOn || selected || focusId === id);
  const group = payload.projectedKind === "group";
  const internals = payload.internals;
  return (
    <PathHostFrame id={id} selected={on} departing={!!departing}>
      <Handle type="target" position={Position.Left} />
      {group && internals ? (
        <MergedStepTile
          actor={actor}
          doc={workflow}
          internals={internals}
          selected={on && !departing}
          lifted={dragging}
        />
      ) : (
        <StepTile
          actor={actor}
          kind={node.stepKind}
          title={node.title}
          detail={group ? "" : node.detail}
          selected={on && !departing}
          lifted={dragging}
        />
      )}
      <Handle type="source" position={Position.Right} />
    </PathHostFrame>
  );
}
