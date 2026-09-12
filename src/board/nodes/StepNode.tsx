/**
 * React Flow node for a Step tile (actor + task).
 * Lane in node.data chooses Before vs After assignment (actorFor).
 * After Who is lane-specific; the graph is shared with Before.
 */
import { Handle, type NodeProps } from "@xyflow/react";
import { AssignmentLane, SelectionKind } from "../../workflow/catalogs";
import { useStore } from "../../state/store";
import { StepTile } from "../tiles/StepTile";
import { SimplifiedTile } from "../tiles/SimplifiedTile";
import { PathHostFrame } from "../controls/PathHostFrame";
import { findNode } from "../../workflow/selectors";
import { isStepNode, laneAssignments, type StepNodeDto } from "../../workflow/types";
import { useSimplifyView } from "../simplify/SimplifyContext";
import { simplifyHeadline } from "../simplify/headline";
import { flowProfile } from "../flow/flowProfile";
import { rfHandle } from "../flow/rfHandle";

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
  const { simplified } = useSimplifyView();
  const profile = flowProfile(useStore((s) => s.boardOrientation));
  if (!node || !isStepNode(node)) return null;
  const on = !!(storeOn || selected || focusId === id);
  return (
    <PathHostFrame id={id} selected={on} departing={!!departing}>
      <Handle type="target" position={rfHandle(profile.handleIn)} />
      {simplified ? (
        <SimplifiedTile
          kind="step"
          text={simplifyHeadline(node)}
          selected={on && !departing}
          lifted={dragging}
        />
      ) : (
        <StepTile
          actor={actor}
          kind={node.stepKind}
          title={node.title}
          detail={node.detail}
          selected={on && !departing}
          lifted={dragging}
        />
      )}
      <Handle type="source" position={rfHandle(profile.handleOut)} />
    </PathHostFrame>
  );
}
