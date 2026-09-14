/**
 * Status-bar Horizontal / Vertical radios. Each face is a three-tile tree of
 * rounded squares joined by short straight Paths, highlighted yellow when that
 * orientation is on. Both faces share one viewBox and stroke so the two radios
 * render the same size and weight as the Compare mark next door.
 */
import type { ReactNode } from "react";
import type { BoardOrientation } from "../../board/flow/flowProfile";
import { useStore } from "../../state/store";

// 10-unit tiles, 5-unit Path stubs. Horizontal siblings sit 6 units apart
// (tight stack); Vertical siblings sit 12 units apart (wide fan). The fork
// turns toward each child on a radius-3 arc instead of a hard 90° corner.
const TREE_VIEWBOX = "0 0 38 32";
const TREE_WIDTH = 26;
const TREE_HEIGHT = 22;
const TREE_STROKE = 2.6;
const TILE = 10;
const TILE_RADIUS = 3;

function TreeSvg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox={TREE_VIEWBOX} width={TREE_WIDTH} height={TREE_HEIGHT} aria-hidden>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={TREE_STROKE}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {children}
      </g>
    </svg>
  );
}

function Tile({ x, y }: { x: number; y: number }) {
  return <rect x={x} y={y} width={TILE} height={TILE} rx={TILE_RADIUS} />;
}

/** Parent on the left, two children on the right (flow left to right). */
function HorizontalTreeIcon() {
  return (
    <TreeSvg>
      <Tile x={4} y={11} />
      <path d="M14 16H19" />
      <path d="M24 8H22A3 3 0 0 0 19 11V21A3 3 0 0 0 22 24H24" />
      <Tile x={24} y={3} />
      <Tile x={24} y={19} />
    </TreeSvg>
  );
}

/** Parent on top, two children below (flow top to bottom). */
function VerticalTreeIcon() {
  return (
    <TreeSvg>
      <Tile x={14} y={1} />
      <path d="M19 11V16" />
      <path d="M8 21V19A3 3 0 0 1 11 16H27A3 3 0 0 1 30 19V21" />
      <Tile x={3} y={21} />
      <Tile x={25} y={21} />
    </TreeSvg>
  );
}

const OPTIONS: Array<{
  value: BoardOrientation;
  label: string;
  Icon: typeof HorizontalTreeIcon;
}> = [
  { value: "horizontal", label: "Horizontal", Icon: HorizontalTreeIcon },
  { value: "vertical", label: "Vertical", Icon: VerticalTreeIcon },
];

export function OrientationSwitch({
  previewValue,
}: {
  previewValue?: BoardOrientation;
} = {}) {
  const live = useStore((s) => s.boardOrientation);
  const orientation = previewValue ?? live;
  const frozen = previewValue !== undefined;
  return (
    <div
      className="view-switch orientation-switch"
      role="radiogroup"
      aria-label="Board orientation"
    >
      <div className="view-switch-track">
        {OPTIONS.map((opt) => {
          const on = orientation === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-label={opt.label}
              aria-checked={on}
              title={opt.label}
              data-orientation-icon={opt.value}
              className={`view-switch-btn${on ? " is-on" : ""}`}
              onClick={() => {
                if (frozen) return;
                useStore.getState().setBoardOrientation(opt.value);
              }}
            >
              <opt.Icon />
            </button>
          );
        })}
      </div>
    </div>
  );
}
