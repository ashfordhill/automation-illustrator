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

/** Straight chunky double-headed compass: left/right spawn (P-01, P-06). */
function SpawnArrows() {
  return (
    <svg
      className="canvas-helper-spawn-arrows"
      data-spawn-compass="true"
      viewBox="0 0 268 32"
      width="268"
      height="32"
      aria-hidden
    >
      <line x1="16" y1="16" x2="252" y2="16" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" />
      <path d="M 22 10 L 6 16 L 22 22 Z" fill="currentColor" />
      <path d="M 246 10 L 262 16 L 246 22 Z" fill="currentColor" />
      <line x1="134" y1="1" x2="134" y2="31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function SpawnHints({ after }: { after: boolean }) {
  const k = useStore.getState().keymap;
  const pk = (a: (typeof KeyAction)[keyof typeof KeyAction]) => prettyKey(k[a]);
  const step = after ? "After-only Step" : "+ Step";
  const leftStep = k[KeyAction.AddStepIn] ? { key: pk(KeyAction.AddStepIn), label: step } : null;
  const rightStep = k[KeyAction.AddStepOut] ? { key: pk(KeyAction.AddStepOut), label: step } : null;
  const leftData = !after && k[KeyAction.AddDataIn] ? { key: pk(KeyAction.AddDataIn), label: "+ Data" } : null;
  const rightData = !after && k[KeyAction.AddDataOut] ? { key: pk(KeyAction.AddDataOut), label: "+ Data" } : null;
  if (!leftStep && !rightStep && !leftData && !rightData) return null;
  return (
    <div
      className="canvas-helper-spawn"
      data-spawn-hints="true"
      role="group"
      aria-label={
        after ? "Add After-only Step left or right" : "Q and A add to the left, E and D add to the right"
      }
    >
      <div className="canvas-helper-spawn-row">
        {leftStep ? <Chip item={leftStep} /> : <span />}
        {rightStep ? <Chip item={rightStep} /> : <span />}
      </div>
      <SpawnArrows />
      {after ? null : (
        <div className="canvas-helper-spawn-row">
          {leftData ? <Chip item={leftData} /> : <span />}
          {rightData ? <Chip item={rightData} /> : <span />}
        </div>
      )}
    </div>
  );
}

function hintsFor(): { chips: Hint[]; spawnAfter: boolean | null } {
  const s = useStore.getState();
  const k = s.keymap;
  const pk = (a: (typeof KeyAction)[keyof typeof KeyAction]) => prettyKey(k[a]);

  if (s.interaction.kind === "path-label-edit") {
    return { chips: [{ key: "Esc", label: "Close" }], spawnAfter: null };
  }
  if (s.interaction.kind === "plus-pull") {
    return { chips: [{ key: "Esc", label: "Cancel" }], spawnAfter: null };
  }
  if (s.interaction.kind === "path-pull") {
    return {
      chips: [
        { key: "Release", label: "Connect to the Node under the knot" },
        { key: "Esc", label: "Cancel" },
      ],
      spawnAfter: null,
    };
  }
  if (s.interaction.kind === "tile-drag") {
    return {
      chips: [{ key: "Drop", label: "on a Path or fork to insert. Neighbors make a gap." }, { key: "Esc", label: "Cancel" }],
      spawnAfter: null,
    };
  }
  if (s.interaction.kind === "remove-preview") {
    return {
      chips: [
        { key: pk(KeyAction.Confirm), label: "Apply pairings" },
        { key: "Esc", label: "Cancel" },
      ],
      spawnAfter: null,
    };
  }
  if (s.interaction.kind === "connect-existing") {
    return {
      chips: [
        { key: "Click", label: "Connect existing Node" },
        { key: "Esc", label: "Cancel" },
      ],
      spawnAfter: null,
    };
  }
  if (s.selected?.type === SelectionKind.Edge) {
    if (s.view === ViewMode.Both) return { chips: [], spawnAfter: null };
    const items: Hint[] = [
      { key: pk(KeyAction.ToggleDash), label: "Dotted / Solid" },
      { key: pk(KeyAction.Confirm), label: "Edit label" },
    ];
    if (s.rightClickDelete) {
      items.push({ key: "Right-click", label: "Delete" });
    }
    if (canRemovePath(s.workflow, s.selected.id)) {
      items.push({ key: pk(KeyAction.Delete), label: "Remove Path" });
    }
    return { chips: items, spawnAfter: null };
  }
  if (s.selected?.type === SelectionKind.Node) {
    if (s.view === ViewMode.Both) return { chips: [], spawnAfter: null };
    const n =
      s.workflow.nodes.find((x) => x.id === s.selected!.id) ??
      s.workflow.after.extraNodes.find((x) => x.id === s.selected!.id);
    const chips: Hint[] = [];
    if (s.view === ViewMode.After) {
      if (s.workflow.after.extraNodes.some((x) => x.id === s.selected!.id)) {
        chips.push({ key: pk(KeyAction.RemoveNode), label: "Remove Step" });
      }
      if (s.rightClickDelete) {
        chips.push({ key: "Right-click", label: "Delete" });
      }
      return { chips, spawnAfter: true };
    }
    chips.push({
      key: pk(KeyAction.RemoveNode),
      label: n?.type === WorkflowNodeKind.DataField ? "Remove Data" : "Remove Step",
    });
    if (s.rightClickDelete) {
      chips.push({ key: "Right-click", label: "Delete" });
    }
    return { chips, spawnAfter: false };
  }
  return { chips: [], spawnAfter: null };
}

export function CanvasHelper() {
  const present = useStore((s) => s.present);
  useStore((s) => s.selected);
  useStore((s) => s.interaction);
  useStore((s) => s.keymap);
  useStore((s) => s.view);
  useStore((s) => s.rightClickDelete);
  if (present) return null;
  const { chips, spawnAfter } = hintsFor();
  if (!chips.length && spawnAfter === null) return null;
  return (
    <div className="canvas-helper" aria-live="polite">
      {spawnAfter !== null ? <SpawnHints after={spawnAfter} /> : null}
      {chips.map((item) => (
        <Chip key={`${item.key}-${item.label}`} item={item} />
      ))}
    </div>
  );
}
