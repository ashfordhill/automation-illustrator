/**
 * Shared New / Demo / Import gate: Save copy, Discard, or Cancel (SH-06).
 * Cancel never mutates. Save copy downloads the current v2 YAML first.
 */
import { Button, Group, Modal, Text } from "@mantine/core";
import { demoName } from "../../demos/catalog";
import { useStore, type PendingReplace } from "../../state/store";

function copyFor(pending: PendingReplace): { title: string; body: string } {
  if (pending.kind === "new") {
    return {
      title: "Start a new board?",
      body: "This replaces the board that is open now. Save a copy first if you want to keep it.",
    };
  }
  if (pending.kind === "demo") {
    const name = demoName(pending.demoId);
    return {
      title: `Load ${name}?`,
      body: `${name} will replace the board that is open now. Save a copy first if you want to keep it.`,
    };
  }
  return {
    title: "Import this board?",
    body: "The imported file will replace the board that is open now. Save a copy first if you want to keep it.",
  };
}

export function ReplaceDocumentModal() {
  const pending = useStore((s) => s.pendingReplace);
  const opened = pending !== null;
  const copy = pending ? copyFor(pending) : { title: "Replace this board?", body: "" };

  return (
    <Modal
      opened={opened}
      onClose={() => useStore.getState().cancelReplace()}
      title={copy.title}
      centered
      closeOnClickOutside
      closeOnEscape
    >
      <Text size="sm" mb="md">
        {copy.body}
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={() => useStore.getState().cancelReplace()}>
          Cancel
        </Button>
        <Button color="red" variant="light" onClick={() => useStore.getState().confirmReplaceDiscard()}>
          Discard
        </Button>
        <Button onClick={() => useStore.getState().confirmReplaceSaveCopy()}>Save copy</Button>
      </Group>
    </Modal>
  );
}
