/**
 * Startup recovery when saved JSON cannot migrate (SH-10).
 * Raw storage stays on its original key until Start fresh writes a new board.
 */
import { Button, Group, List, Modal, Text } from "@mantine/core";
import { useStore } from "../../state/store";

export function RecoveryModal() {
  const recovery = useStore((s) => s.recovery);
  const opened = recovery !== null;

  return (
    <Modal
      opened={opened}
      onClose={() => {}}
      title="Could not load the saved board"
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
    >
      <Text size="sm" mb="sm">
        The original file is still in this browser. Download a recovery copy before starting
        fresh.
      </Text>
      {recovery && recovery.violations.length > 0 ? (
        <List size="sm" mb="md" spacing={4}>
          {recovery.violations.map((item, index) => (
            <List.Item key={`${item.code}-${index}`}>{item.message}</List.Item>
          ))}
        </List>
      ) : (
        <Text size="sm" mb="md">
          {recovery?.message ?? "Saved browser data is not a valid workflow."}
        </Text>
      )}
      <Group justify="flex-end">
        <Button variant="default" onClick={() => useStore.getState().downloadHeldRecovery()}>
          Download recovery copy
        </Button>
        <Button color="red" onClick={() => useStore.getState().startFresh()}>
          Start fresh
        </Button>
      </Group>
    </Modal>
  );
}
