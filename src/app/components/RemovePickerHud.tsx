/**
 * Many-to-many Node-removal pairing HUD (WG-11).
 * Candidate pick uses the on-tile X (WG-08); this dialog only appears when
 * pairings must be reviewed before apply.
 */
import { useEffect, useRef } from "react";
import { Button, Group, Select, Stack, Text } from "@mantine/core";
import { useStore } from "../../state/store";
import {
  removalNeighborhood,
  validatePairings,
} from "../../workflow/commands";
import { nodeCaption } from "../../workflow/types";
import { findNode } from "../../workflow/selectors";

export function RemovePickerHud() {
  const interaction = useStore((s) => s.interaction);
  const workflow = useStore((s) => s.workflow);
  const present = useStore((s) => s.present);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (present) return;
    if (interaction.kind !== "remove-preview") return;
    confirmRef.current?.focus();
  }, [present, interaction]);

  if (present || interaction.kind !== "remove-preview") return null;

  const { predecessorIds, successorIds } = removalNeighborhood(
    workflow,
    interaction.plan.nodeId,
  );
  const checked = validatePairings(
    interaction.plan.pairings,
    predecessorIds,
    successorIds,
  );
  const predLabel = (id: string) => nodeCaption(findNode(workflow, id), id);
  const bySucc = new Map(interaction.plan.pairings.map((p) => [p.successorId, p.predecessorId]));
  return (
    <div className="remove-picker-hud" role="dialog" aria-label="Confirm Node removal pairings">
      <Text fw={800} size="sm" mb={6}>
        Pair Paths that will replace the removed Node
      </Text>
      <Stack gap={6}>
        {successorIds.map((succ) => (
          <Select
            key={succ}
            size="xs"
            label={`Into ${predLabel(succ)}`}
            value={bySucc.get(succ) ?? null}
            data={predecessorIds.map((id) => ({ value: id, label: predLabel(id) }))}
            onChange={(v) => v && useStore.getState().setPreviewSuccessorPred(succ, v)}
            allowDeselect={false}
          />
        ))}
      </Stack>
      <Group gap="xs" mt="sm">
        <Button size="xs" variant="light" onClick={() => useStore.getState().useNearestPreviewPairings()}>
          Nearest
        </Button>
        <Button size="xs" variant="light" onClick={() => useStore.getState().useFanPreviewPairings()}>
          Every pairing
        </Button>
      </Group>
      <Group gap="xs" mt="sm" justify="flex-end">
        <Button size="xs" variant="default" onClick={() => useStore.getState().closeBoardModes()}>
          Cancel
        </Button>
        <Button
          ref={confirmRef}
          size="xs"
          color="red"
          disabled={!checked.ok}
          onClick={() => useStore.getState().confirmRemove()}
        >
          Confirm
        </Button>
      </Group>
      {!checked.ok ? (
        <Text size="xs" mt={6} className="hint-copy">
          {checked.message}
        </Text>
      ) : null}
    </div>
  );
}
