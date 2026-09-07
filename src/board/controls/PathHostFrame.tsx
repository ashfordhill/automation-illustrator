/**
 * Wrapper around a React Flow node: NodeToolbar for +/− and the on-tile
 * Remove X during pick (WG-08). Click selects or completes Connect existing /
 * highlights a removal candidate.
 */
import { type ReactNode } from "react";
import { NodeToolbar, Position } from "@xyflow/react";
import { IconX } from "@tabler/icons-react";
import { SelectionKind, ViewMode } from "../../workflow/catalogs";
import { useStore } from "../../state/store";
import { afterAwareRemovalCandidateIds } from "../../workflow/merge";
import { findNode } from "../../workflow/selectors";
import { nodeCaption } from "../../workflow/types";
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
  const present = useStore((s) => s.present);
  const view = useStore((s) => s.view);
  const interaction = useStore((s) => s.interaction);
  const workflow = useStore((s) => s.workflow);
  const showPad =
    !present &&
    view !== ViewMode.Both &&
    !departing &&
    interaction.kind !== "remove-pick" &&
    interaction.kind !== "remove-preview" &&
    interaction.kind !== "merge-pick" &&
    (selected || (interaction.kind === "add-menu" && interaction.sourceId === id));
  const removeCandidates =
    interaction.kind === "remove-pick"
      ? afterAwareRemovalCandidateIds(workflow, interaction.hostId)
      : [];
  const showRemoveX = !present && !departing && removeCandidates.includes(id);
  const caption = nodeCaption(findNode(workflow, id), id);
  return (
    <div
      className={`nopan${departing ? " node-squash-inner" : ""}`}
      style={{ position: "relative", width: "100%", height: "100%" }}
      aria-hidden={departing || undefined}
      onClick={(e) => {
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
        if (s.interaction.kind === "merge-pick") {
          e.stopPropagation();
          s.toggleMergeMember(id);
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
      {showRemoveX ? (
        <NodeToolbar
          isVisible
          position={Position.Top}
          offset={16}
          className="nopan nowheel node-remove-x"
        >
          <button
            type="button"
            className="node-remove-x-btn"
            aria-label={`Remove ${caption}`}
            title={`Remove ${caption}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              useStore.getState().removePickedNode(id);
            }}
          >
            <IconX size={22} stroke={2.6} aria-hidden />
          </button>
        </NodeToolbar>
      ) : null}
    </div>
  );
}
