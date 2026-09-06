/**
 * + / − on the right of a tile (PathHostFrame).
 * + opens a Step / Data / existing-tile submenu; − starts pathPick.
 * Hidden in Present and Hand tool.
 */
import { type CSSProperties } from "react";
import { prettyKey, KeyAction } from "../../keyboard/bindings";
import { useStore } from "../../state/store";
import { WorkflowNodeKind } from "../../workflow/catalogs";
import { outgoingSorted } from "../../workflow/graph";

export function OutgoingPathPad({ nodeId }: { nodeId: string }) {
  const count = useStore(
    (s) => outgoingSorted(s.workflow.nodes, s.workflow.edges, nodeId).length,
  );
  const linking = useStore((s) => s.linkFrom === nodeId);
  const picking = useStore((s) => s.pathPick?.sourceId === nodeId);
  const menuOpen = useStore((s) => s.linkMenu === nodeId);
  const keymap = useStore((s) => s.keymap);
  const plusOn = linking || menuOpen;
  return (
    <div
      className="nopan nowheel outgoing-path-pad"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        right: -22,
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        zIndex: 4,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          type="button"
          title="Add a path: new Step, new Data, or link an existing tile"
          onClick={() => useStore.getState().openLinkMenu(nodeId)}
          style={{
            ...padBtn,
            background: plusOn ? "var(--plus-active)" : "var(--plus)",
            color: "#f4fff6",
          }}
        >
          +
        </button>
        <button
          type="button"
          title="Choose a path to detach"
          onClick={() => useStore.getState().beginPathPick(nodeId)}
          disabled={count === 0}
          style={{
            ...padBtn,
            background: picking ? "var(--minus-active)" : "var(--minus)",
            color: "#fff5f5",
            opacity: count === 0 ? 0.35 : 1,
          }}
        >
          −
        </button>
      </div>
      {menuOpen ? (
        <div className="path-plus-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => useStore.getState().spawnBranch(nodeId, WorkflowNodeKind.Step)}
          >
            <kbd>{prettyKey(keymap[KeyAction.AddBranchStep])}</kbd>
            Step
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => useStore.getState().spawnBranch(nodeId, WorkflowNodeKind.DataField)}
          >
            <kbd>{prettyKey(keymap[KeyAction.AddBranchData])}</kbd>
            Data
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => useStore.getState().beginLinkFrom(nodeId)}
          >
            <kbd>{prettyKey(keymap[KeyAction.LinkExisting])}</kbd>
            Existing
          </button>
        </div>
      ) : null}
    </div>
  );
}

const padBtn: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  border: "3px solid var(--line)",
  fontWeight: 800,
  fontSize: 22,
  lineHeight: 1,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 3px 0 var(--btn-shadow)",
};
