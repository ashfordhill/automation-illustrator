/**
 * React Flow node for a Data-field tile.
 * Same PathHostFrame as StepNode so +/− linking works on fields too.
 */
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { SelectionKind, WorkflowNodeKind } from "../../workflow/catalogs";
import { useStore } from "../../state/store";
import { DataTile } from "../tiles/DataTile";
import { PathHostFrame } from "../controls/PathHostFrame";
import { findNode } from "../../workflow/selectors";

export function DataFieldNode({ id, selected, dragging }: NodeProps) {
  const departing = useStore((s) => s.departing?.node.id === id);
  const node = useStore((s) => {
    const live = findNode(s.workflow, id);
    if (live) return live;
    const ghost = s.departing?.node;
    return ghost?.id === id ? ghost : undefined;
  });
  const focusId = useStore((s) => s.focusId);
  const storeOn = useStore(
    (s) => s.selected?.type === SelectionKind.Node && s.selected.id === id,
  );
  if (!node || node.type !== WorkflowNodeKind.DataField) return null;
  const on = !!(storeOn || selected || focusId === id);
  return (
    <PathHostFrame id={id} selected={on} departing={departing}>
      <Handle type="target" position={Position.Left} />
      <DataTile label={node.label} selected={on && !departing} lifted={dragging} />
      <Handle type="source" position={Position.Right} />
    </PathHostFrame>
  );
}
