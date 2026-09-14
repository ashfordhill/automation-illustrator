/**
 * Hamburger + Undo + Redo ActionIcons. Toolbar wires live actions;
 * the Theme preview mounts the same cluster with Undo/Redo disabled.
 */
import type { ReactNode } from "react";
import { ActionIcon, Group, Tooltip } from "@mantine/core";
import { IconArrowBackUp, IconArrowForwardUp } from "@tabler/icons-react";

export function ChromeToolCluster({
  menu,
  undoDisabled,
  redoDisabled,
  undoLabel,
  redoLabel,
  onUndo,
  onRedo,
}: {
  menu: ReactNode;
  undoDisabled: boolean;
  redoDisabled: boolean;
  undoLabel: string;
  redoLabel: string;
  onUndo?: () => void;
  onRedo?: () => void;
}) {
  return (
    <Group gap="xs" wrap="nowrap">
      {menu}
      <Group gap="xs" className="chrome-hide" wrap="nowrap">
        <Tooltip label={undoLabel}>
          <ActionIcon
            variant="default"
            disabled={undoDisabled}
            aria-label={undoLabel}
            onClick={onUndo}
          >
            <IconArrowBackUp size={18} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={redoLabel}>
          <ActionIcon
            variant="default"
            disabled={redoDisabled}
            aria-label={redoLabel}
            onClick={onRedo}
          >
            <IconArrowForwardUp size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
}
