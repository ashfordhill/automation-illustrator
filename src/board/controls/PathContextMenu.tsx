/**
 * Right-click Path menu (WG-05). Delete is enabled only when the remaining
 * graph stays a connected DAG.
 */
import { Menu } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useStore } from "../../state/store";
import { canRemovePath, MSG } from "../../workflow/commands";

export function PathContextMenu() {
  const interaction = useStore((s) => s.interaction);
  const workflow = useStore((s) => s.workflow);
  if (interaction.kind !== "path-menu") return null;
  const allowed = canRemovePath(workflow, interaction.edgeId);
  return (
    <Menu
      opened
      onChange={(open) => {
        if (!open) useStore.getState().closeBoardModes();
      }}
      position="bottom-start"
      offset={6}
      shadow="md"
      width={188}
      withinPortal
      zIndex={4000}
    >
      <Menu.Target>
        <div
          aria-hidden
          tabIndex={-1}
          className="path-context-anchor"
          style={{
            position: "fixed",
            left: interaction.x,
            top: interaction.y,
            width: 1,
            height: 1,
          }}
        />
      </Menu.Target>
      <Menu.Dropdown className="path-context-menu">
        <Menu.Item
          color="red"
          disabled={!allowed}
          title={allowed ? "Delete Path" : MSG.pathRemoval}
          aria-label={allowed ? "Delete Path" : "Delete Path (would leave a Tile unreachable)"}
          data-testid="path-menu-delete"
          leftSection={<IconTrash size={16} stroke={2.2} aria-hidden />}
          onClick={() => useStore.getState().removePath(interaction.edgeId)}
        >
          Delete
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
