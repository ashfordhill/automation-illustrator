/**
 * React Flow node for a Data-field tile.
 * Same PathHostFrame as StepNode so +/− linking works on fields too.
 */
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { SelectionKind, WorkflowNodeKind } from "../model/catalogs";
import { useStore } from "../state/store";
import { DataTile } from "../tiles/DataTile";
import { PathHostFrame } from "./PathHostFrame";

export function DataFieldNode({ id, selected, dragging }: NodeProps) {
  const node = useStore((s) => s.workflow.nodes.find((n) => n.id === id));
  const focusId = useStore((s) => s.focusId);
  const storeOn = useStore(
    (s) => s.selected?.type === SelectionKind.Node && s.selected.id === id,
  );
  if (!node || node.type !== WorkflowNodeKind.DataField) return null;
  const on = !!(storeOn || selected || focusId === id);
  return (
    <PathHostFrame id={id} selected={on}>
      <Handle type="target" position={Position.Left} />
      <DataTile label={node.label} selected={on} lifted={dragging} />
      <Handle type="source" position={Position.Right} />
    </PathHostFrame>
  );
}
