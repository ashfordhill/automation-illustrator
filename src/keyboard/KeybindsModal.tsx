/**
 * Rebind modal for keyboard/bindings.ts.
 * Opened from the hamburger Keybinds item (store.helpOpen). Esc is documented, not rebindable.
 */
import { Button, Group, Kbd, Modal, Stack, Text } from "@mantine/core";
import { ACTION_LABELS, prettyKey, type KeyAction } from "./bindings";
import { KeyPreset } from "../model/catalogs";
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
    >
      <Text size="sm" className="hint-copy" mb="sm">
      Click a key to rebind it. The board helper at the top of the canvas uses these
      mappings. During path detach, Up/Down or W/S cycle the flashing arrows.
      </Text>
      <Group mb="sm">
        <Button
          size="xs"
          onClick={() => useStore.getState().applyPreset(KeyPreset.Arrows)}
        >
          Arrow keys
        </Button>
        <Button
          size="xs"
          variant="light"
          onClick={() => useStore.getState().applyPreset(KeyPreset.Wasd)}
        >
          WASD
        </Button>
      </Group>
      <Stack gap={6}>
        {ACTIONS.map((a) => (
          <Group key={a} justify="space-between">
            <Text size="sm">{ACTION_LABELS[a]}</Text>
            <Button
              size="compact-xs"
              variant={capturing === a ? "filled" : "default"}
              onClick={() => useStore.getState().setCapturing(a)}
            >
              {capturing === a ? "Press a key…" : prettyKey(keymap[a])}
            </Button>
          </Group>
        ))}
        <Group justify="space-between">
          <Text size="sm">Cancel link / detach</Text>
          <Kbd>Esc</Kbd>
        </Group>
      </Stack>
    </Modal>
  );
}
