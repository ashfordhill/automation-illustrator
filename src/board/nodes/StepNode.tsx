/**
 * React Flow node for a Step tile (actor + task).
 * Lane in node.data chooses Before vs After assignment (actorFor).
 */
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AssignmentLane, SelectionKind } from "../../workflow/catalogs";
import { useStore } from "../../state/store";
import { StepTile } from "../tiles/StepTile";
import { PathHostFrame } from "../controls/PathHostFrame";
import { isStepNode } from "../../workflow/types";

export function StepNode({ id, selected, dragging, data }: NodeProps) {
  const lane = (data?.lane as AssignmentLane) ?? AssignmentLane.Before;
  const departing = useStore((s) => (s.departing?.node.id === id ? s.departing : null));
  const node = useStore((s) => {
    const live = s.workflow.nodes.find((n) => n.id === id);
    if (live) return live;
    return s.departing?.node.id === id ? s.departing.node : undefined;
  });
  const actor = useStore((s) => s.actorFor(id, lane) ?? departing?.actor);
  const focusId = useStore((s) => s.focusId);
  const storeOn = useStore(
    (s) => s.selected?.type === SelectionKind.Node && s.selected.id === id,
  );
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
