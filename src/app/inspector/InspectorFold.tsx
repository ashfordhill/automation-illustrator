/**
 * Drawer fold for the right inspector (P-05). Expanded: Hide (›).
 * Collapsed: a thin strip with ‹ to bring the inspector back.
 */
import { Tooltip } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useStore } from "../../state/store";

export const INSPECTOR_OPEN_WIDTH = 320;
export const INSPECTOR_STRIP_WIDTH = 28;

export function InspectorFold() {
  const collapsed = useStore((s) => s.inspectorCollapsed);
  const label = collapsed ? "Show inspector" : "Hide inspector";

  return (
    <div className="inspector-fold-slot">
      <Tooltip label={label} position="left" openDelay={280}>
        <button
          type="button"
          className="inspector-fold"
          aria-label={label}
          aria-expanded={!collapsed}
          aria-controls="details-rail-body"
          data-inspector-fold={collapsed ? "collapsed" : "open"}
          onClick={() => useStore.getState().setInspectorCollapsed(!collapsed)}
        >
          {collapsed ? (
            <IconChevronLeft size={20} stroke={2.75} aria-hidden />
          ) : (
            <IconChevronRight size={20} stroke={2.75} aria-hidden />
          )}
        </button>
      </Tooltip>
    </div>
  );
}
