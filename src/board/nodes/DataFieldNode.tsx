/**
 * React Flow node for a Data-field tile.
 * Same PathHostFrame as StepNode so + / Path-pull / X chrome works on fields too.
 */
import { Handle, type NodeProps } from "@xyflow/react";
import { SelectionKind, WorkflowNodeKind } from "../../workflow/catalogs";
import { useStore } from "../../state/store";
import { DataTile } from "../tiles/DataTile";
import { SimplifiedTile } from "../tiles/SimplifiedTile";
import { PathHostFrame } from "../controls/PathHostFrame";
import { findNode } from "../../workflow/selectors";
import { useSimplifyView } from "../simplify/SimplifyContext";
import { simplifyHeadline } from "../simplify/headline";
import { flowProfile } from "../flow/flowProfile";
import { rfHandle } from "../flow/rfHandle";

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
  const { simplified } = useSimplifyView();
  const profile = flowProfile(useStore((s) => s.boardOrientation));
  if (!node || node.type !== WorkflowNodeKind.DataField) return null;
  const on = !!(storeOn || selected || focusId === id);
  return (
    <PathHostFrame id={id} selected={on} departing={departing}>
      <Handle type="target" position={rfHandle(profile.handleIn)} />
      {simplified ? (
        <SimplifiedTile
          kind="data"
          text={simplifyHeadline(node)}
          selected={on && !departing}
          lifted={dragging}
        />
      ) : (
        <DataTile label={node.label} selected={on && !departing} lifted={dragging} />
      )}
      <Handle type="source" position={rfHandle(profile.handleOut)} />
    </PathHostFrame>
  );
}
