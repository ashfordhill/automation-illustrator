/**
 * Quiet Excalidraw-style hint strip at the bottom of the board (P-06).
 * Idle has no chips. Hints appear only for a selection or an active task.
 * Rejections use TransientNotice instead of this strip.
 */
import { prettyKey, KeyAction } from "../../keyboard/bindings";
import { useStore } from "../../state/store";
import {
  SelectionKind,
  ViewMode,
  WorkflowNodeKind,
} from "../../workflow/catalogs";
import { canRemovePath } from "../../workflow/commands";

type Hint = { key: string; label: string };

function Chip({ item }: { item: Hint }) {
  return (
    <span className="canvas-helper-chip">
      <kbd>{item.key}</kbd>
      <span>{item.label}</span>
    </span>
  );
}

function hintsFor(): Hint[] {
  const s = useStore.getState();
  const k = s.keymap;
  const pk = (a: (typeof KeyAction)[keyof typeof KeyAction]) => prettyKey(k[a]);

  if (s.interaction.kind === "path-label-edit") {
    return [{ key: "Esc", label: "Close" }];
  }
  if (s.interaction.kind === "plus-pull") {
    return [{ key: "Esc", label: "Cancel" }];
  }
  if (s.interaction.kind === "path-pull") {
    return [
      { key: "Release", label: "Connect to the Node under the knot" },
      { key: "Esc", label: "Cancel" },
    ];
  }
  if (s.interaction.kind === "tile-drag") {
    return [
      { key: "Drop", label: "on a Path to insert. Neighbors make a gap." },
      { key: "Esc", label: "Cancel" },
    ];
  }
  if (s.interaction.kind === "remove-preview") {
    return [
      { key: pk(KeyAction.Confirm), label: "Apply pairings" },
      { key: "Esc", label: "Cancel" },
    ];
  }
  if (s.interaction.kind === "connect-existing") {
    return [
      { key: "Click", label: "Connect existing Node" },
      { key: "Esc", label: "Cancel" },
    ];
  }
  if (s.selected?.type === SelectionKind.Edge) {
    if (s.view === ViewMode.Both) return [];
    const items: Hint[] = [
      { key: pk(KeyAction.ToggleDash), label: "Dotted / Solid" },
      { key: pk(KeyAction.Confirm), label: "Edit label" },
      { key: "Right-click", label: "Delete" },
    ];
    if (canRemovePath(s.workflow, s.selected.id)) {
      items.push({ key: pk(KeyAction.Delete), label: "Remove Path" });
    }
    return items;
  }
  if (s.selected?.type === SelectionKind.Node) {
    const n =
      s.workflow.nodes.find((x) => x.id === s.selected!.id) ??
      s.workflow.after.extraNodes.find((x) => x.id === s.selected!.id);
    const items: Hint[] = [];
    if (s.view === ViewMode.Both) return [];
    if (s.view === ViewMode.After) {
      if (k[KeyAction.AddStepIn]) {
        items.push({ key: pk(KeyAction.AddStepIn), label: "After-only Step left" });
      }
      if (k[KeyAction.AddStepOut]) {
        items.push({ key: pk(KeyAction.AddStepOut), label: "After-only Step right" });
      }
      if (s.workflow.after.extraNodes.some((x) => x.id === s.selected!.id)) {
        items.push({ key: pk(KeyAction.RemoveNode), label: "Remove Step" });
      }
      if (s.rightClickDelete) {
        items.push({ key: "Right-click", label: "Delete" });
      }
      return items;
    }
    if (k[KeyAction.AddStepIn]) items.push({ key: pk(KeyAction.AddStepIn), label: "New Step left" });
    if (k[KeyAction.AddStepOut]) items.push({ key: pk(KeyAction.AddStepOut), label: "New Step right" });
    if (k[KeyAction.AddDataIn]) items.push({ key: pk(KeyAction.AddDataIn), label: "New Data left" });
    if (k[KeyAction.AddDataOut]) items.push({ key: pk(KeyAction.AddDataOut), label: "New Data right" });
    items.push({
      key: pk(KeyAction.RemoveNode),
      label: n?.type === WorkflowNodeKind.DataField ? "Remove Data" : "Remove Step",
    });
    if (s.rightClickDelete) {
      items.push({ key: "Right-click", label: "Delete" });
    }
    return items;
  }
  return [];
}

export function CanvasHelper() {
  const present = useStore((s) => s.present);
  useStore((s) => s.selected);
  useStore((s) => s.interaction);
  useStore((s) => s.keymap);
  useStore((s) => s.view);
  useStore((s) => s.rightClickDelete);
  if (present) return null;
  const items = hintsFor();
  if (!items.length) return null;
  return (
    <div className="canvas-helper" aria-live="polite">
      {items.map((item) => (
        <Chip key={`${item.key}-${item.label}`} item={item} />
      ))}
    </div>
  );
}
