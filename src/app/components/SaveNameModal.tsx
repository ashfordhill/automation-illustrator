/**
 * Save as for browsers without a save dialog (Firefox, Safari, or the app on
 * plain HTTP from another machine): name the file here, then the browser
 * downloads it to its usual folder. Opens over Export image and the replace gate.
 */
import { useEffect, useRef, useState } from "react";
import { Button, Group, Modal, Text, TextInput } from "@mantine/core";
import { useStore } from "../../state/store";

export function SaveNameModal() {
  const prompt = useStore((s) => s.saveNamePrompt);
  const [name, setName] = useState("");
  /* Mantine focuses the field after its open transition; select the name part then, once. */
  const selectStem = useRef(false);

  useEffect(() => {
    if (!prompt) return;
    setName(prompt.suggestedName);
    selectStem.current = true;
  }, [prompt]);

  const onFocus = (input: HTMLInputElement) => {
    if (!selectStem.current || !prompt) return;
    selectStem.current = false;
    const value = input.value;
    const end = value.toLowerCase().endsWith(prompt.extension)
      ? value.length - prompt.extension.length
      : value.length;
    requestAnimationFrame(() => input.setSelectionRange(0, end));
  };

  const cancel = () => useStore.getState().answerSaveName(null);
  const save = () => {
    if (name.trim()) useStore.getState().answerSaveName(name.trim());
  };

  return (
    <Modal opened={prompt !== null} onClose={cancel} title="Save as" centered zIndex={320}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <TextInput
          data-autofocus
          label="File name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          onFocus={(e) => onFocus(e.currentTarget)}
          spellCheck={false}
          autoComplete="off"
        />
        <Text size="sm" c="dimmed" mt="xs">
          This browser saves to its downloads folder.
        </Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={cancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim()}>
            Save
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
