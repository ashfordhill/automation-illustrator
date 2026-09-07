/**
 * Top bar: Undo, Not saved, Before/After/Both, hamburger.
 * Present keeps the automation score here because the right rail is hidden.
 * Pointer/Hand were removed (P-08); sound toggle arrives in Slice 8.
 */
import { useRef } from "react";
import {
  ActionIcon,
  Group,
  Menu,
  SegmentedControl,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowBackUp,
  IconFileImport,
  IconMenu2,
  IconMoon,
  IconPresentation,
  IconQuestionMark,
  IconSun,
} from "@tabler/icons-react";
import { DEMO_CHOICES } from "../../demos/catalog";
import { prettyKey, KeyAction } from "../../keyboard/bindings";
import { useStore } from "../../state/store";
import {
  ColorScheme,
  ViewMode,
} from "../../workflow/catalogs";
import { automationScore } from "../../workflow/scoring";
import { PersistStatusChip } from "./PersistStatusChip";

export function Toolbar() {
  const view = useStore((s) => s.view);
  const present = useStore((s) => s.present);
  const workflow = useStore((s) => s.workflow);
  const keymap = useStore((s) => s.keymap);
  const past = useStore((s) => s.past);
  const colorScheme = useStore((s) => s.colorScheme);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Group
        justify="space-between"
        wrap="nowrap"
        px="sm"
        h={56}
        className="chrome-bar"
        style={{
          borderBottom: "2px solid var(--chrome-line)",
        }}
      >
        <Group gap="xs" wrap="nowrap">
          <Group gap="xs" className="chrome-hide" wrap="nowrap">
            <Tooltip label={`Undo (${prettyKey(keymap[KeyAction.Undo])} / Ctrl+Z)`}>
              <ActionIcon
                variant="default"
                disabled={!past.length}
                aria-label={`Undo (${prettyKey(keymap[KeyAction.Undo])} / Ctrl+Z)`}
                onClick={() => useStore.getState().undo()}
              >
                <IconArrowBackUp size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
          <PersistStatusChip />
        </Group>

        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1, justifyContent: "center" }}>
          <SegmentedControl
            size="xs"
            color="cyan"
            value={view}
            onChange={(v) => useStore.getState().setView(v as typeof view)}
            data={[
              { value: ViewMode.Before, label: "Before" },
              { value: ViewMode.After, label: "After" },
              { value: ViewMode.Both, label: "Both" },
            ]}
          />
          {present ? (
            <Text size="sm" fw={700} lineClamp={2} style={{ maxWidth: 380 }}>
              {automationScore(workflow)}
            </Text>
          ) : null}
        </Group>

        <Group gap="xs" wrap="nowrap">
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              void file.text().then((t) => {
                useStore.getState().importRaw(t);
              });
            }}
          />
          <Menu shadow="md" width={240} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="default" aria-label="Menu">
                <IconMenu2 size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconPresentation size={16} />}
                onClick={() => useStore.getState().setPresent(!present)}
              >
                {present ? "Exit present" : "Present"}
              </Menu.Item>
              <Menu.Item onClick={() => useStore.getState().requestNew()}>New</Menu.Item>
              <Menu.Item
                leftSection={<IconFileImport size={16} />}
                onClick={() => fileRef.current?.click()}
              >
                Import
              </Menu.Item>
              <Menu.Item
                leftSection={<IconQuestionMark size={16} />}
                onClick={() => useStore.getState().setHelp(true)}
              >
                Keybinds
              </Menu.Item>
              <Menu.Item
                leftSection={
                  colorScheme === ColorScheme.Dark ? <IconSun size={16} /> : <IconMoon size={16} />
                }
                onClick={() => useStore.getState().toggleColorScheme()}
              >
                {colorScheme === ColorScheme.Dark ? "Light mode" : "Dark mode"}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Label>Demo</Menu.Label>
              {DEMO_CHOICES.map((demo) => (
                <Menu.Item
                  key={demo.id}
                  onClick={() => useStore.getState().requestDemo(demo.id)}
                >
                  {demo.name}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </>
  );
}
