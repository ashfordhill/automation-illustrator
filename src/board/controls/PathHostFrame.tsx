/**
 * Wrapper around a React Flow node: selected-tile + / Path-pull / X chrome (CX-01).
 * Click selects, completes a Path pull, or toggles merge membership.
 */
import { type ReactNode } from "react";
import { SelectionKind } from "../../workflow/catalogs";
import { useStore } from "../../state/store";
import { TileChrome } from "./TileChrome";

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
  return (
    <div
      className={`nopan${departing ? " node-squash-inner" : ""}`}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "visible" }}
      aria-hidden={departing || undefined}
      onClick={(e) => {
        const s = useStore.getState();
        if (s.present || departing) return;
        if (s.interaction.kind === "path-pull") {
          s.completePathPull(id);
          return;
        }
        if (s.interaction.kind === "connect-existing") {
          if (s.interaction.sourceId !== id) s.completeLinkTo(id);
          return;
        }
        if (s.interaction.kind === "merge-pick") {
          e.stopPropagation();
          s.toggleMergeMember(id);
          return;
        }
        if (s.interaction.kind === "remove-preview") return;
        if (s.interaction.kind === "plus-pull" || s.interaction.kind === "tile-drag") {
          return;
        }
        s.select({ type: SelectionKind.Node, id });
        queueMicrotask(() => {
          const ae = document.activeElement;
          if (ae instanceof HTMLElement && ae.closest(".details-rail")) ae.blur();
        });
      }}
    >
      <TileChrome id={id} selected={selected && !present} departing={departing}>
        {children}
      </TileChrome>
    </div>
  );
}
