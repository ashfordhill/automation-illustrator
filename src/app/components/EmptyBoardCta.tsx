/**
 * Empty-board call to action (WG-01): Add Step creates the sole root.
 */
import { Button, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useStore } from "../../state/store";

export function EmptyBoardCta() {
  const present = useStore((s) => s.present);
  const empty = useStore((s) => s.workflow.nodes.length === 0);
  if (present || !empty) return null;

  return (
    <div className="empty-board-cta">
      <Text fw={800} size="sm">
        This board is empty.
      </Text>
      <Button
        leftSection={<IconPlus size={18} />}
        onClick={() => useStore.getState().addStep()}
      >
        Add Step
      </Button>
    </div>
  );
}
