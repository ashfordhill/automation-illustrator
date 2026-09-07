/**
 * Contextual hint strip at the top of the board (P-06).
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

  if (s.interaction.kind === "remove-pick") {
    return [
      { key: pk(KeyAction.PanUp), label: "Previous Node" },
      { key: pk(KeyAction.PanDown), label: "Next Node" },
      { key: pk(KeyAction.Confirm), label: "Confirm remove" },
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
  if (s.interaction.kind === "add-menu") {
    return [
      { key: pk(KeyAction.AddBranchStep), label: "New Step" },
      { key: pk(KeyAction.AddBranchData), label: "New Data" },
      { key: pk(KeyAction.LinkExisting), label: "Connect existing" },
      { key: "Esc", label: "Cancel" },
    ];
  }
  if (s.selected?.type === SelectionKind.Edge) {
    return [
      { key: pk(KeyAction.ToggleDash), label: "Always visited / Choice" },
      { key: pk(KeyAction.Confirm), label: "Edit condition" },
      { key: pk(KeyAction.Delete), label: "Paths aren't removed" },
    ];
  }
  if (s.selected?.type === SelectionKind.Node) {
    const n = s.workflow.nodes.find((x) => x.id === s.selected!.id);
    const items: Hint[] = [];
    if (s.view !== ViewMode.After) {
      items.push({ key: pk(KeyAction.AddPath), label: "Add Path" });
    }
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
