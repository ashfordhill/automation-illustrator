/**
 * Present-only expand / collapse control for one Compare pane (P-07, AQ-02).
 * Expand fills the window with this Before or After lane; collapse returns to split.
 */
import { Tooltip } from "@mantine/core";
import { IconArrowsMaximize, IconArrowsMinimize } from "@tabler/icons-react";
import type { AssignmentLane } from "../../workflow/catalogs";
import { useStore } from "../../state/store";

export function PresentExpandButton({ lane }: { lane: AssignmentLane }) {
  const expanded = useStore((s) => s.presentExpand === lane);
  const name = lane === "after" ? "After" : "Before";
  const label = expanded ? "Show Before and After" : `Expand ${name}`;

  return (
    <Tooltip label={label}>
      <button
        type="button"
        className="present-expand-btn"
        aria-label={label}
        data-present-expand-btn={lane}
        data-expanded={expanded ? "true" : "false"}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          const s = useStore.getState();
          s.setPresentExpand(expanded ? null : lane);
        }}
      >
        {expanded ? (
          <IconArrowsMinimize size={22} stroke={2.2} aria-hidden />
        ) : (
          <IconArrowsMaximize size={22} stroke={2.2} aria-hidden />
        )}
      </button>
    </Tooltip>
  );
}
