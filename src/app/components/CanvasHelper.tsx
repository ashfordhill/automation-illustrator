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
    return [
      { key: pk(KeyAction.ToggleDash), label: "Dotted / Solid" },
      { key: pk(KeyAction.Confirm), label: "Edit label" },
      { key: pk(KeyAction.Delete), label: "Paths aren't removed" },
    ];
  }
  if (s.selected?.type === SelectionKind.Node) {
    const n =
      s.workflow.nodes.find((x) => x.id === s.selected!.id) ??
      s.workflow.after.extraNodes.find((x) => x.id === s.selected!.id);
    const items: Hint[] = [];
    if (s.view === ViewMode.Both) return [];
    if (s.view === ViewMode.After) {
      items.push({ key: pk(KeyAction.AddBranchStep), label: "After-only Step" });
      if (s.workflow.after.extraNodes.some((x) => x.id === s.selected!.id)) {
        items.push({ key: pk(KeyAction.RemoveNode), label: "Remove Step" });
      }
      return items;
    }
    items.push({ key: pk(KeyAction.AddBranchStep), label: "New Step" });
    items.push({ key: pk(KeyAction.AddBranchData), label: "New Data" });
    items.push({
      key: pk(KeyAction.RemoveNode),
      label: n?.type === WorkflowNodeKind.DataField ? "Remove Data" : "Remove Step",
    });
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
