/**
 * + / − in a React Flow NodeToolbar (CX-01) so pads are not covered by the tile.
 * + opens Step / Data / Connect existing; − enters the Node-removal picker (WG-08).
 * Hidden in Present. + is hidden in After until Slice 11.
 */
import { type CSSProperties } from "react";
import { prettyKey, KeyAction } from "../../keyboard/bindings";
import { useStore } from "../../state/store";
import { ViewMode, WorkflowNodeKind } from "../../workflow/catalogs";

export function OutgoingPathPad({ nodeId }: { nodeId: string }) {
  const interaction = useStore((s) => s.interaction);
  const keymap = useStore((s) => s.keymap);
  const view = useStore((s) => s.view);
  const linking = interaction.kind === "connect-existing" && interaction.sourceId === nodeId;
  const picking = interaction.kind === "remove-pick" && interaction.hostId === nodeId;
  const menuOpen = interaction.kind === "add-menu" && interaction.sourceId === nodeId;
  const plusOn = linking || menuOpen;
  const showPlus = view !== ViewMode.After;
  return (
    <div
      className="nopan nowheel outgoing-path-pad"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {showPlus ? (
          <button
            type="button"
            aria-label="Add Step, Data, or Connect existing"
            title="Add a Path: new Step, new Data, or Connect existing"
            onClick={() => useStore.getState().openLinkMenu(nodeId)}
            style={{
              ...padBtn,
              background: plusOn ? "var(--plus-active)" : "var(--plus)",
              color: "#f4fff6",
            }}
          >
            +
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Remove Node"
          title="Remove a Node. The workflow will be reconnected."
          onClick={() => useStore.getState().beginRemovePick(nodeId)}
          style={{
            ...padBtn,
            background: picking ? "var(--minus-active)" : "var(--minus)",
            color: "#fff5f5",
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
            Connect existing
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
