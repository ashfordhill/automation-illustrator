/**
 * Excalidraw-style hint strip at the top of the board.
 * Keys come from store.keymap so rebinds stay the source of truth.
 * Content follows selection / + menu / − pick / link-existing.
 */
import { prettyKey, KeyAction } from "../../keyboard/bindings";
import { useStore } from "../../state/store";
import {
  SelectionKind,
  WorkflowNodeKind,
} from "../../workflow/catalogs";
import { outgoingSorted } from "../../workflow/graph";

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

  if (s.pathPick) {
    return [
      { key: pk(KeyAction.PanUp), label: "Previous path" },
      { key: pk(KeyAction.PanDown), label: "Next path" },
      { key: pk(KeyAction.PathConfirm), label: "Detach" },
      { key: "Esc", label: "Cancel" },
    ];
  }
  if (s.linkFrom) {
    return [
      { key: "Click", label: "Connect existing tile" },
      { key: "Click", label: "Empty board → new step" },
      { key: pk(KeyAction.DetachPath), label: "Detach instead" },
      { key: "Esc", label: "Cancel" },
    ];
  }
  if (s.linkMenu) {
    return [
      { key: pk(KeyAction.AddBranchStep), label: "New step" },
      { key: pk(KeyAction.AddBranchData), label: "New data" },
      { key: pk(KeyAction.LinkExisting), label: "Link existing" },
      { key: pk(KeyAction.DetachPath), label: "Detach path" },
      { key: "Esc", label: "Cancel" },
    ];
  }
  if (s.selected?.type === SelectionKind.Edge) {
    return [
      { key: pk(KeyAction.ToggleDash), label: "Solid / dotted" },
      { key: pk(KeyAction.PathConfirm), label: "Edit label" },
      { key: pk(KeyAction.Delete), label: "Delete path" },
    ];
  }
  if (s.selected?.type === SelectionKind.Node) {
    const outs = outgoingSorted(s.workflow.nodes, s.workflow.edges, s.selected.id).length;
    const n = s.workflow.nodes.find((x) => x.id === s.selected!.id);
    const items: Hint[] = [
      { key: pk(KeyAction.AddPath), label: "Add path" },
    ];
    if (outs) items.push({ key: pk(KeyAction.DetachPath), label: "Detach path" });
    items.push({ key: pk(KeyAction.Delete), label: n?.type === WorkflowNodeKind.DataField ? "Delete data" : "Delete step" });
    return items;
  }
  return [
    { key: pk(KeyAction.ToolPointer), label: "Pointer" },
    { key: pk(KeyAction.ToolHand), label: "Hand" },
    { key: pk(KeyAction.Undo), label: "Undo" },
  ];
}

export function CanvasHelper() {
  const present = useStore((s) => s.present);
  useStore((s) => s.selected);
  useStore((s) => s.linkMenu);
  useStore((s) => s.linkFrom);
  useStore((s) => s.pathPick);
  useStore((s) => s.keymap);
  if (present) return null;
  const items = hintsFor();
  return (
    <div className="canvas-helper" aria-live="polite">
      {items.map((item) => (
        <Chip key={`${item.key}-${item.label}`} item={item} />
      ))}
    </div>
  );
}
