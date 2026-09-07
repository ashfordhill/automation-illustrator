/**
 * Compact Merge / Unmerge dock for editable After view (MG-01).
 * Present, Before, and Both hide this dock (P-07, BA-05).
 */
import { useEffect, useRef } from "react";
import { Button, Group, Text } from "@mantine/core";
import { prettyKey, KeyAction } from "../../keyboard/bindings";
import { useStore } from "../../state/store";
import { ViewMode } from "../../workflow/catalogs";
import { expandMergeSelection } from "../../workflow/merge";
import { findMergeGroup, findNode } from "../../workflow/selectors";
import { isStepNode, stepDisplayLabel } from "../../workflow/types";

function caption(workflow: ReturnType<typeof useStore.getState>["workflow"], id: string) {
  const n = findNode(workflow, id);
  if (n && isStepNode(n)) return stepDisplayLabel(n.stepKind, n.title);
  return id;
}

export function MergeDock() {
  const view = useStore((s) => s.view);
  const present = useStore((s) => s.present);
  const interaction = useStore((s) => s.interaction);
  const workflow = useStore((s) => s.workflow);
  const selected = useStore((s) => s.selected);
  const keymap = useStore((s) => s.keymap);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const picking = interaction.kind === "merge-pick";
  const group = selected?.type === "node" ? findMergeGroup(workflow, selected.id) : undefined;

  useEffect(() => {
    if (present || !picking) return;
    confirmRef.current?.focus();
  }, [present, picking, interaction]);

  if (present || view !== ViewMode.After) return null;

  const preview = picking ? expandMergeSelection(workflow, interaction.memberIds) : null;
  const members = preview?.ok ? preview.value.memberIds : [];
  const supporting = preview?.ok ? preview.value.supportingIds : [];

  return (
    <div className="merge-dock" role="region" aria-label="Merge and Unmerge">
      {picking ? (
        <>
          <Text fw={800} size="sm" mb={6}>
            Merge these Steps?
          </Text>
          {!preview?.ok ? (
            <Text size="xs" className="hint-copy" mb={8}>
              {preview?.message}
            </Text>
          ) : (
            <>
              <div className="remove-picker-list">
                {members.map((id) => (
                  <span key={id} className="remove-picker-item on">
                    {caption(workflow, id)}
                  </span>
                ))}
              </div>
              {supporting.length ? (
                <Text size="xs" mt={6} className="hint-copy">
                  Includes {supporting.map((id) => caption(workflow, id)).join(", ")}
                </Text>
              ) : null}
            </>
          )}
          <Group gap="xs" mt="sm" justify="flex-end">
            <Button size="xs" variant="default" onClick={() => useStore.getState().closeBoardModes()}>
              Cancel
            </Button>
            <Button
              ref={confirmRef}
              size="xs"
              className="chunky-primary"
              disabled={!preview?.ok}
              onClick={() => useStore.getState().confirmMerge()}
            >
              Confirm
            </Button>
          </Group>
        </>
      ) : (
        <>
          <Text fw={800} size="sm" mb={4}>
            Merge groups
          </Text>
          <Text size="xs" className="hint-copy" mb={8}>
            Select Before-origin Steps, then Merge. Unmerge restores the whole group.
          </Text>
          <Group gap="xs">
            <Button
              size="xs"
              className="chunky-primary"
              aria-label="Merge"
              onClick={() => useStore.getState().beginMerge()}
            >
              Merge
              <kbd className="merge-dock-kbd" aria-hidden>
                {prettyKey(keymap[KeyAction.Merge])}
              </kbd>
            </Button>
            <Button
              size="xs"
              variant="light"
              aria-label="Unmerge"
              disabled={!group}
              onClick={() => useStore.getState().unmerge()}
            >
              Unmerge
              <kbd className="merge-dock-kbd" aria-hidden>
                {prettyKey(keymap[KeyAction.Unmerge])}
              </kbd>
            </Button>
          </Group>
        </>
      )}
    </div>
  );
}
