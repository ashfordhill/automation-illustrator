/**
 * Rebind modal for keyboard/bindings.ts.
 * Opened from the hamburger Keybinds item (store.helpOpen). Esc is documented, not rebindable.
 */
import { Button, Group, Kbd, Modal, Stack, Text } from "@mantine/core";
import { ACTION_LABELS, prettyKey, type KeyAction } from "./bindings";
import { useStore } from "../state/store";

const ACTIONS = Object.keys(ACTION_LABELS) as KeyAction[];

export function KeybindsModal() {
  const help = useStore((s) => s.helpOpen);
  const capturing = useStore((s) => s.capturing);
  const keymap = useStore((s) => s.keymap);

  return (
    <Modal
      opened={help}
      onClose={() => useStore.getState().setHelp(false)}
      title="Keybinds"
      centered
      size="lg"
      returnFocus={false}
    >
      <Text size="sm" className="hint-copy" mb="sm">
        Click a key to rebind it. Esc cancels capture. Backspace or Delete while capturing
        clears it. Contextual hints on the canvas use these mappings.
      </Text>
      <Group mb="sm">
        <Button size="xs" onClick={() => useStore.getState().resetKeymap()}>
          Reset to defaults
        </Button>
      </Group>
      <Stack gap={6}>
        {ACTIONS.map((a) => (
          <Group key={a} justify="space-between">
            <Text size="sm">{ACTION_LABELS[a]}</Text>
            <Button
              size="compact-xs"
              variant={capturing === a ? "filled" : "default"}
              aria-label={
                capturing === a
                  ? `Press a new key for ${ACTION_LABELS[a]}`
                  : `${ACTION_LABELS[a]} (${prettyKey(keymap[a])})`
              }
              onClick={() => useStore.getState().setCapturing(a)}
            >
              {capturing === a ? "Press a key…" : prettyKey(keymap[a])}
            </Button>
          </Group>
        ))}
        <Group justify="space-between">
          <Text size="sm">Cancel link / remove picker</Text>
          <Kbd>Esc</Kbd>
        </Group>
        <Group justify="space-between">
          <Text size="sm">Show split, then exit Present</Text>
          <Kbd>Esc</Kbd>
        </Group>
      </Stack>
    </Modal>
  );
}
