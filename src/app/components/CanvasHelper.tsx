/**
 * Quiet Excalidraw-style hint strip at the bottom-left of the board (P-06).
 * Idle has no chips. Hints appear only for a selection or an active task.
 * Rejections use TransientNotice instead of this strip.
 */
import { prettyKey, KeyAction } from "../../keyboard/bindings";
import { useStore } from "../../state/store";
import { SelectionKind, ViewMode } from "../../workflow/catalogs";
import { canRemovePath } from "../../workflow/commands";
import { MouseRightClickIcon } from "./MouseRightClickIcon";

type Hint = { key: string; label: string; mark?: "stroke" };

function StrokeToggleMark() {
  return (
    <span className="canvas-helper-stroke" data-stroke-toggle="true" aria-label="Dotted / Solid">
      <svg viewBox="0 0 22 8" width="22" height="8" data-stroke-sample="dotted" aria-hidden>
        <line
          x1="1.5"
          y1="4"
          x2="20.5"
          y2="4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="2.2 3.2"
        />
      </svg>
      <span aria-hidden>/</span>
      <svg viewBox="0 0 22 8" width="22" height="8" data-stroke-sample="solid" aria-hidden>
        <line
          x1="1.5"
          y1="4"
          x2="20.5"
          y2="4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function Chip({ item }: { item: Hint }) {
  const mouse = item.key === "Right-click";
  return (
    <span className="canvas-helper-chip">
      <kbd className={mouse ? "is-mouse" : undefined}>
        {mouse ? <MouseRightClickIcon size={12} /> : item.key}
      </kbd>
      {mouse ? <span className="visually-hidden">Right-click</span> : null}
      {item.mark === "stroke" ? <StrokeToggleMark /> : <span>{item.label}</span>}
    </span>
  );
}

function SpawnArrow({ dir }: { dir: "left" | "right" | "up" | "down" }) {
  const vertical = dir === "up" || dir === "down";
  const up = dir === "up";
  const left = dir === "left";
  return (
    <svg
      className="canvas-helper-spawn-arrow"
      data-spawn-arrow={dir}
      viewBox={vertical ? "0 0 12 16" : "0 0 36 12"}
      width={vertical ? 10 : 32}
      height={vertical ? 12 : 10}
      aria-hidden
    >
      {vertical ? (
        up ? (
          <>
            <line x1="6" y1="15" x2="6" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M1.5 7 L6 1 L10.5 7 Z" fill="currentColor" />
          </>
        ) : (
          <>
            <line x1="6" y1="1" x2="6" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M1.5 9 L6 15 L10.5 9 Z" fill="currentColor" />
          </>
        )
      ) : left ? (
        <>
          <line x1="34" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M11 1.5 L1 6 L11 10.5 Z" fill="currentColor" />
        </>
      ) : (
        <>
          <line x1="2" y1="6" x2="26" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M25 1.5 L35 6 L25 10.5 Z" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

function SpawnKey({ area, value }: { area: string; value: string | null }) {
  if (!value) return <span className={`canvas-helper-spawn-${area}`} />;
  return <kbd className={`canvas-helper-spawn-${area}`}>{value}</kbd>;
}

/** Four-corner spawn compass: keys stay at Q/E/A/D; Horizontal step/data top/bottom, Vertical left/right (P-06). */
function SpawnHints() {
  const k = useStore.getState().keymap;
  const orientation = useStore((s) => s.boardOrientation);
  const pk = (a: (typeof KeyAction)[keyof typeof KeyAction]) => prettyKey(k[a]);
  const q = k[KeyAction.AddStepIn] ? pk(KeyAction.AddStepIn) : null;
  const e = k[KeyAction.AddStepOut] ? pk(KeyAction.AddStepOut) : null;
  const a = k[KeyAction.AddDataIn] ? pk(KeyAction.AddDataIn) : null;
  const d = k[KeyAction.AddDataOut] ? pk(KeyAction.AddDataOut) : null;
  if (!q && !e && !a && !d) return null;
  const vertical = orientation === "vertical";
  return (
    <div
      className="canvas-helper-spawn"
      data-spawn-hints="true"
      data-spawn-compass="true"
      data-orientation={orientation}
      role="group"
      aria-label={
        vertical
          ? "Q and A add a Step above or below, E and D add Data above or below"
          : "Q and A add to the left, E and D add to the right"
      }
    >
      <SpawnKey area="q" value={q} />
      <span className="canvas-helper-spawn-kind-step">step</span>
      <SpawnKey area="e" value={e} />
      <SpawnArrow dir={vertical ? "up" : "left"} />
      <span className="canvas-helper-spawn-tile" data-spawn-tile="true" />
      <SpawnArrow dir={vertical ? "down" : "right"} />
      <SpawnKey area="a" value={a} />
      <span className="canvas-helper-spawn-kind-data">data</span>
      <SpawnKey area="d" value={d} />
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
    return { chips: [], spawnAfter: null };
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
      { key: pk(KeyAction.ToggleDash), label: "Dotted / Solid", mark: "stroke" },
      { key: pk(KeyAction.Confirm), label: "Edit text" },
      { key: "Right-click", label: "delete" },
    ];
    if (canRemovePath(s.workflow, s.selected.id)) {
      items.push({ key: pk(KeyAction.Delete), label: "Remove Path" });
    }
    return { chips: items, spawnAfter: null };
  }
  if (s.selected?.type === SelectionKind.Node) {
    if (s.view === ViewMode.Both) return { chips: [], spawnAfter: null };
    const chips: Hint[] = [];
    if (s.rightClickDelete) {
      chips.push({ key: "Right-click", label: "delete" });
    }
    return { chips, spawnAfter: true };
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
  useStore((s) => s.boardOrientation);
  if (present) return null;
  const { chips, spawnAfter } = hintsFor();
  if (!chips.length && spawnAfter === null) return null;
  const extras = chips.map((item) => <Chip key={`${item.key}-${item.label}`} item={item} />);
  return (
    <div className="canvas-helper" data-helper-dock="bottom-left" aria-live="polite">
      {spawnAfter !== null ? (
        <div className="canvas-helper-cluster">
          <SpawnHints />
          {extras}
        </div>
      ) : (
        extras
      )}
    </div>
  );
}
