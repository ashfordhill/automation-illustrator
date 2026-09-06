/**
 * React Flow node for a Step tile (actor + task).
 * Lane in node.data chooses Before vs After assignment (actorFor).
 */
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AssignmentLane, SelectionKind, WorkflowNodeKind } from "../../workflow/catalogs";
import { useStore } from "../../state/store";
import { StepTile } from "../tiles/StepTile";
import { PathHostFrame } from "../controls/PathHostFrame";

export function StepNode({ id, selected, dragging, data }: NodeProps) {
  const lane = (data?.lane as AssignmentLane) ?? AssignmentLane.Before;
  const node = useStore((s) => s.workflow.nodes.find((n) => n.id === id));
  const actor = useStore((s) => s.actorFor(id, lane));
  const focusId = useStore((s) => s.focusId);
  const storeOn = useStore(
    (s) => s.selected?.type === SelectionKind.Node && s.selected.id === id,
  );
  if (!node || node.type !== WorkflowNodeKind.Step) return null;
  const on = !!(storeOn || selected || focusId === id);
  return (
    <PathHostFrame id={id} selected={on}>
      <Handle type="target" position={Position.Left} />
      <StepTile
        actor={actor}
        kind={node.stepKind}
        title={node.title}
        detail={node.detail}
        selected={on}
        lifted={dragging}
      />
      <Handle type="source" position={Position.Right} />
    </PathHostFrame>
  );
}
