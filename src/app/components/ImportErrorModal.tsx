/**
 * Import parse failure. The live board and saved storage are left untouched.
 */
import { Button, Group, Modal, Text } from "@mantine/core";
import { useStore } from "../../state/store";

export function ImportErrorModal() {
  const importError = useStore((s) => s.importError);

  return (
    <Modal
      opened={importError !== null}
      onClose={() => useStore.getState().clearImportError()}
      title="Could not import"
      centered
    >
      <Text size="sm" mb="md">
        {importError}
      </Text>
      <Group justify="flex-end">
        <Button onClick={() => useStore.getState().clearImportError()}>OK</Button>
      </Group>
    </Modal>
  );
}
