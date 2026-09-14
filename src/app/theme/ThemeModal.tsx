/**
 * Theme window (Improvements 65, 66). Opened from the hamburger Theme item.
 * Edits a draft that only the preview paints; Save applies it to the app and closes.
 * Row 1: preset dropdown · Import · Export. Then the live preview, seven color
 * cards, and the texture picker with Reset · Save.
 */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { ActionIcon, Button, Group, Modal, Select, Stack, Text, TextInput } from "@mantine/core";
import { IconMenu2, IconTrash } from "@tabler/icons-react";
import { useStore } from "../../state/store";
import { PaperTextureSvg } from "../../board/PaperTexture";
import { ChromeToolCluster } from "../components/ChromeToolCluster";
import { OrientationSwitch } from "../components/OrientationSwitch";
import { ColorField } from "./ColorField";
import { TexturePicker } from "./TexturePicker";
import {
  BUILTIN_THEMES,
  THEME_COLOR_SWATCHES,
  isBuiltinThemeId,
  themeCssVars,
  themeNameTaken,
  type ThemeColorKey,
} from "./chromeTheme";
import "./ThemeModal.css";

const PICKERS: Array<{ key: ThemeColorKey; caption: string; label: string }> = [
  { key: "chrome", caption: "Frame", label: "Frame color" },
  { key: "chromeWell", caption: "Well", label: "Well color" },
  { key: "chromeBtn", caption: "Button", label: "Button color" },
  { key: "chromeLine", caption: "Outline", label: "Outline color" },
  { key: "chromeInk", caption: "Ice", label: "Ice color" },
  { key: "yellow", caption: "Selected", label: "Selected color" },
  { key: "paper", caption: "Paper", label: "Paper color" },
];

/** Narrow enough that Import / Export and Reset / Save sit near the content, not at a far edge. */
const THEME_WINDOW_WIDTH = 520;

const THEME_FILE_ACCEPT =
  ".yaml,.yml,.json,application/json,text/yaml,text/x-yaml,application/yaml";

/** Nested prompts close on Escape themselves and keep the key from the Theme window. */
function stopEscape(e: KeyboardEvent<HTMLElement>, onEscape: () => void) {
  if (e.key !== "Escape") return;
  e.stopPropagation();
  e.preventDefault();
  onEscape();
}

function SaveThemePrompt() {
  const opened = useStore((s) => s.themePrompt === "save");
  const draft = useStore((s) => s.themeDraft);
  const custom = useStore((s) => s.themes.custom);
  const [name, setName] = useState("");
  useEffect(() => {
    if (opened) setName("");
  }, [opened]);
  const preset = draft
    ? [...BUILTIN_THEMES, ...custom].find((t) => t.id === draft.presetId)
    : undefined;
  const builtin = !!preset && isBuiltinThemeId(preset.id);
  const trimmed = name.trim();
  const taken = trimmed.length > 0 && themeNameTaken(trimmed, [...BUILTIN_THEMES, ...custom]);
  const canSaveNew = trimmed.length > 0 && !taken;
  const close = () => useStore.getState().setThemePrompt(null);

  function submitNew(e?: FormEvent) {
    e?.preventDefault();
    if (!canSaveNew) return;
    useStore.getState().saveTheme({ name: trimmed });
  }

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Save theme"
      centered
      size="sm"
      zIndex={300}
      withCloseButton={false}
      closeOnEscape={false}
      returnFocus={false}
      className="theme-prompt"
    >
      <form onSubmit={submitNew} onKeyDown={(e) => stopEscape(e, close)}>
        <Stack gap="sm">
          {builtin ? (
            <Text size="sm">Built-in themes can&apos;t be overwritten. Name your theme.</Text>
          ) : null}
          <TextInput
            label="Name"
            placeholder="New theme name"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            error={taken ? "That name is already used" : undefined}
            data-autofocus
            maxLength={60}
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="default" size="xs" onClick={close}>
              Cancel
            </Button>
            {!builtin && preset ? (
              <Button
                size="xs"
                variant="default"
                onClick={() => useStore.getState().saveTheme("overwrite")}
              >
                Save over {preset.name}
              </Button>
            ) : null}
            <Button size="xs" type="submit" disabled={!canSaveNew} className="theme-primary-btn">
              {builtin ? "Save" : "Save as new"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

function DiscardThemePrompt() {
  const opened = useStore((s) => s.themePrompt === "discard");
  const keep = () => useStore.getState().setThemePrompt(null);
  return (
    <Modal
      opened={opened}
      onClose={keep}
      title="Discard changes?"
      centered
      size="sm"
      zIndex={300}
      withCloseButton={false}
      closeOnEscape={false}
      returnFocus={false}
      className="theme-prompt"
    >
      <div onKeyDown={(e) => stopEscape(e, keep)}>
        <Stack gap="sm">
          <Text size="sm">Your edits are only in this window. Discard them?</Text>
          <Group justify="flex-end" gap="xs">
            <Button variant="default" size="xs" onClick={keep} data-autofocus>
              Keep editing
            </Button>
            <Button
              size="xs"
              className="theme-primary-btn"
              onClick={() => useStore.getState().closeTheme()}
            >
              Discard
            </Button>
          </Group>
        </Stack>
      </div>
    </Modal>
  );
}

export function ThemeModal() {
  const opened = useStore((s) => s.themeOpen);
  const draft = useStore((s) => s.themeDraft);
  const custom = useStore((s) => s.themes.custom);
  const edited = useStore((s) => s.themeDraftEdited());
  const fileRef = useRef<HTMLInputElement>(null);

  const presetId = draft?.presetId ?? BUILTIN_THEMES[0]!.id;
  const builtin = isBuiltinThemeId(presetId);
  const previewVars = draft ? (themeCssVars(draft) as CSSProperties) : undefined;

  // Escape is handled here instead of by Mantine so an open color / texture
  // wheel (whose swatches hold focus) or the preset dropdown can take the key
  // first; only a bare Escape asks to close the window.
  useEffect(() => {
    if (!opened) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape" || e.isComposing) return;
      if (useStore.getState().themePrompt) return;
      const target = e.target as HTMLElement | null;
      if (target?.getAttribute?.("data-mantine-stop-propagation") === "true") return;
      if (document.querySelector(".inspector-color-pop")) return;
      useStore.getState().requestCloseTheme();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [opened]);

  // Built-ins are plain options; only the user's presets get a group label.
  const selectData = [
    ...BUILTIN_THEMES.map((t) => ({ value: t.id, label: t.name })),
    ...(custom.length
      ? [
          {
            group: "My themes",
            items: custom.map((t) => ({ value: t.id, label: t.name })),
          },
        ]
      : []),
  ];

  function onSave() {
    const s = useStore.getState();
    if (s.themeDraftEdited()) {
      s.setThemePrompt("save");
      return;
    }
    s.saveTheme("overwrite");
  }

  return (
    <Modal
      opened={opened}
      onClose={() => useStore.getState().requestCloseTheme()}
      title={<span className="visually-hidden">Theme</span>}
      centered
      size={THEME_WINDOW_WIDTH}
      returnFocus={false}
      closeOnEscape={false}
      closeButtonProps={{ "aria-label": "Close" }}
      className="theme-window"
    >
      <div className="theme-row theme-row-top">
        <Group gap="xs" wrap="nowrap" className="theme-preset-group">
          <Select
            aria-label="Theme preset"
            data={selectData}
            value={presetId}
            onChange={(v) => {
              if (v) useStore.getState().selectThemePreset(v);
            }}
            allowDeselect={false}
            size="xs"
            w={190}
            comboboxProps={{ withinPortal: true, zIndex: 450 }}
            className="theme-preset-select"
          />
          {edited ? (
            <span className="theme-edited" data-theme-edited="true">
              Edited
            </span>
          ) : null}
          {!builtin ? (
            <ActionIcon
              variant="default"
              size="md"
              aria-label="Delete theme"
              title="Delete theme"
              className="theme-trash"
              onClick={() => useStore.getState().deleteThemePreset(presetId)}
            >
              <IconTrash size={16} stroke={2.2} aria-hidden />
            </ActionIcon>
          ) : null}
        </Group>
        <Group gap="xs" wrap="nowrap">
          <input
            ref={fileRef}
            type="file"
            accept={THEME_FILE_ACCEPT}
            hidden
            data-theme-file-input="true"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              void file.text().then((t) => {
                useStore.getState().importTheme(t);
              });
            }}
          />
          <Button size="xs" variant="default" onClick={() => fileRef.current?.click()}>
            Import
          </Button>
          <Button size="xs" variant="default" onClick={() => useStore.getState().exportTheme()}>
            Export
          </Button>
        </Group>
      </div>

      <div className="theme-preview chrome-bar" data-theme-preview="true" style={previewVars} inert>
        <div className="theme-preview-paper">
          {draft ? (
            <PaperTextureSvg
              pattern={draft.texture.pattern}
              color={draft.texture.color}
              className="theme-preview-texture"
            />
          ) : null}
          <div className="theme-preview-bar chrome-bar">
            <ChromeToolCluster
              menu={
                <ActionIcon variant="default" aria-label="Menu">
                  <IconMenu2 size={18} />
                </ActionIcon>
              }
              undoDisabled
              redoDisabled
              undoLabel="Undo"
              redoLabel="Redo"
            />
          </div>
          <div className="theme-preview-status chrome-bar">
            <OrientationSwitch previewValue="vertical" />
          </div>
        </div>
      </div>

      <div className="theme-pickers">
        {PICKERS.map((item) => (
          <label key={item.key} className="theme-picker" data-theme-token={item.key}>
            <ColorField
              value={draft?.colors[item.key] ?? BUILTIN_THEMES[0]!.colors[item.key]}
              onChange={(color) =>
                useStore.getState().setThemeDraft({ colors: { [item.key]: color } })
              }
              swatches={THEME_COLOR_SWATCHES}
              ariaLabel={item.label}
              position="bottom-start"
            />
            <span className="theme-picker-caption">{item.caption}</span>
          </label>
        ))}
      </div>

      <div className="theme-row theme-row-bottom">
        {draft ? (
          <TexturePicker
            value={draft.texture}
            paper={draft.colors.paper}
            onChange={(patch) => useStore.getState().setThemeDraft({ texture: patch })}
          />
        ) : null}
        <Group gap="xs" wrap="nowrap" className="theme-actions">
          <Button
            size="xs"
            variant="default"
            disabled={!edited}
            onClick={() => useStore.getState().resetThemeDraft()}
          >
            Reset
          </Button>
          <Button size="xs" className="theme-primary-btn" onClick={onSave}>
            Save
          </Button>
        </Group>
      </div>

      <SaveThemePrompt />
      <DiscardThemePrompt />
    </Modal>
  );
}
