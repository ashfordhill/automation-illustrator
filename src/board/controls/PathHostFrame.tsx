/**
 * Wrapper around a React Flow node: NodeToolbar for +/−,
 * click selects or completes Connect existing / picks a removal candidate.
 */
import { useState, type ReactNode } from "react";
import { NodeToolbar, Position } from "@xyflow/react";
import { SelectionKind } from "../../workflow/catalogs";
import { useStore } from "../../state/store";
import { OutgoingPathPad } from "./OutgoingPathPad";

export function PathHostFrame({
  id,
  selected,
  departing,
  children,
}: {
  id: string;
  selected: boolean;
  departing?: boolean;
  children: ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const present = useStore((s) => s.present);
  const interaction = useStore((s) => s.interaction);
  const showPad =
    !present &&
    !departing &&
    interaction.kind !== "remove-pick" &&
    interaction.kind !== "remove-preview" &&
    (selected || hover || (interaction.kind === "add-menu" && interaction.sourceId === id));
  return (
    <div
      className={`nopan${departing ? " node-squash-inner" : ""}`}
      style={{ position: "relative", width: "100%", height: "100%" }}
      aria-hidden={departing || undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => {
        const s = useStore.getState();
        if (s.present || departing) return;
        if (s.interaction.kind === "connect-existing") {
          if (s.interaction.sourceId !== id) s.completeLinkTo(id);
          return;
        }
        if (s.interaction.kind === "remove-pick") {
          s.setRemoveCandidate(id);
          return;
        }
        if (s.interaction.kind === "remove-preview") return;
        if (s.interaction.kind === "add-menu" && s.interaction.sourceId !== id) {
          s.closeBoardModes();
        }
        s.select({ type: SelectionKind.Node, id });
        queueMicrotask(() => {
          const ae = document.activeElement;
          if (ae instanceof HTMLElement && ae.closest(".details-rail")) ae.blur();
        });
      }}
    >
      {children}
      {showPad ? (
        <NodeToolbar
          isVisible
          position={Position.Right}
          offset={14}
          className="nopan nowheel node-path-toolbar"
        >
          <OutgoingPathPad nodeId={id} />
        </NodeToolbar>
      ) : null}
    </div>
  );
}
