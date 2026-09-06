/**
 * Wrapper around a React Flow node: hover shows OutgoingPathPad,
 * click selects (RF onNodeClick is unreliable) or completes a link-existing.
 */
import { useState, type ReactNode } from "react";
import { SelectionKind, Tool } from "../../workflow/catalogs";
import { isStepNode } from "../../workflow/types";
import { useStore } from "../../state/store";
import { OutgoingPathPad } from "./OutgoingPathPad";

export function PathHostFrame({
  id,
  selected,
  children,
}: {
  id: string;
  selected: boolean;
  children: ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const present = useStore((s) => s.present);
  const tool = useStore((s) => s.tool);
  const showPad = !present && tool !== Tool.Hand && (selected || hover);
  return (
    <div
      className="nopan"
      style={{ position: "relative", width: "100%", height: "100%" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => {
        const s = useStore.getState();
        if (s.present || s.tool === Tool.Hand) return;
        if (s.linkFrom) {
          if (s.linkFrom !== id) s.completeLinkTo(id);
          return;
        }
        if (s.pathPick) return;
        if (s.selected?.type === SelectionKind.Actor) {
          const node = s.workflow.nodes.find((x) => x.id === id);
          if (node && isStepNode(node)) {
            s.assignActor(id, s.selected.id);
            s.select({ type: SelectionKind.Node, id });
            return;
          }
        }
        s.select({ type: SelectionKind.Node, id });
        queueMicrotask(() => {
          const ae = document.activeElement;
          if (ae instanceof HTMLElement && ae.closest(".details-rail")) ae.blur();
        });
      }}
    >
      {children}
      {showPad && <OutgoingPathPad nodeId={id} />}
    </div>
  );
}
