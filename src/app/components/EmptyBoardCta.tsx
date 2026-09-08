/**
 * Empty-board call to action (WG-01): Add Step or Add Data creates the sole root.
 */
import { Button, Text } from "@mantine/core";
import { IconDatabase, IconPlus } from "@tabler/icons-react";
import { ViewMode } from "../../workflow/catalogs";
import { useStore } from "../../state/store";

export function EmptyBoardCta() {
  const present = useStore((s) => s.present);
  const view = useStore((s) => s.view);
  const empty = useStore((s) => s.workflow.nodes.length === 0);
  if (present || view === ViewMode.Both || !empty) return null;

  return (
    <div className="empty-board-cta">
      <Text fw={800} size="sm">
        This board is empty.
      </Text>
      <div className="empty-board-cta-actions">
        <Button leftSection={<IconPlus size={18} />} onClick={() => useStore.getState().addStep()}>
          Add Step
        </Button>
        <Button
          leftSection={<IconDatabase size={18} />}
          onClick={() => useStore.getState().addField()}
        >
          Add Data
        </Button>
      </div>
    </div>
  );
}
