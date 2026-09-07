/**
 * On-canvas Node-removal picker (WG-08, WG-09, WG-11).
 * First-child default, Up/Down among candidates, Enter confirms.
 * Many-to-many shows adjustable pairings before atomic apply.
 */
import { useEffect, useRef } from "react";
import { Button, Group, Select, Stack, Text } from "@mantine/core";
import { useStore } from "../../state/store";
import {
  removalNeighborhood,
  validatePairings,
} from "../../workflow/commands";
import { rootNodeId } from "../../workflow/graph";
import { afterAwareRemovalCandidateIds } from "../../workflow/merge";
import { isDataFieldNode, isStepNode, stepDisplayLabel } from "../../workflow/types";
import { findNode } from "../../workflow/selectors";
import type { NodeDto } from "../../workflow/types";

function caption(node: NodeDto | undefined, fallback: string) {
  if (!node) return fallback;
  if (isDataFieldNode(node)) return node.label || "Data";
  if (isStepNode(node)) return stepDisplayLabel(node.stepKind, node.title);
  return fallback;
}

export function RemovePickerHud() {
  const interaction = useStore((s) => s.interaction);
  const workflow = useStore((s) => s.workflow);
  const present = useStore((s) => s.present);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (present) return;
    if (interaction.kind !== "remove-pick" && interaction.kind !== "remove-preview") return;
    confirmRef.current?.focus();
  }, [present, interaction]);

  if (present) return null;
  if (interaction.kind !== "remove-pick" && interaction.kind !== "remove-preview") {
    return null;
  }

  if (interaction.kind === "remove-preview") {
    const { predecessorIds, successorIds } = removalNeighborhood(
      workflow,
      interaction.plan.nodeId,
    );
    const checked = validatePairings(
      interaction.plan.pairings,
      predecessorIds,
      successorIds,
    );
    const predLabel = (id: string) =>
      caption(findNode(workflow, id), id);
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

  const candidates = afterAwareRemovalCandidateIds(workflow, interaction.hostId);
  const root = rootNodeId(workflow.nodes, workflow.edges);
  const hostIsRoot = root === interaction.hostId;
  return (
    <div className="remove-picker-hud" role="dialog" aria-label="Remove Node">
      <Text fw={800} size="sm" mb={6}>
        Remove which Node?
      </Text>
      {hostIsRoot ? (
        <Text size="xs" mb={8} className="hint-copy">
          The root Node cannot be removed. Use New for a clean board.
        </Text>
      ) : null}
      <div className="remove-picker-list">
        {candidates.map((id) => {
          const node = findNode(workflow, id);
          const on = id === interaction.candidateId;
          return (
            <button
              key={id}
              type="button"
              className={on ? "remove-picker-item on" : "remove-picker-item"}
              onClick={() => useStore.getState().setRemoveCandidate(id)}
            >
            {caption(node, id)}
            </button>
          );
        })}
      </div>
      <Group gap="xs" mt="sm" justify="flex-end">
        <Button size="xs" variant="default" onClick={() => useStore.getState().closeBoardModes()}>
          Cancel
        </Button>
        <Button
          ref={confirmRef}
          size="xs"
          color="red"
          onClick={() => useStore.getState().confirmRemove()}
        >
          Confirm
        </Button>
      </Group>
    </div>
  );
}
