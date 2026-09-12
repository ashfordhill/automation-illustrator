/**
 * Status-bar Horizontal / Vertical radios. Each face is a three-tile tree
 * (rounded Step rectangles), highlighted yellow when that orientation is on.
 */
import type { BoardOrientation } from "../../board/flow/flowProfile";
import { useStore } from "../../state/store";

function HorizontalTreeIcon() {
  return (
    <svg viewBox="0 0 68 36" width="46" height="22" aria-hidden>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <rect x="2" y="12" width="16" height="12" rx="3" />
        <path d="M18 18h10M28 8v20" />
        <path d="M28 8h14" />
        <path d="M28 28h14" />
        <rect x="42" y="2" width="16" height="12" rx="3" />
        <rect x="42" y="22" width="16" height="12" rx="3" />
      </g>
    </svg>
  );
}

function VerticalTreeIcon() {
  return (
    <svg viewBox="0 0 56 36" width="38" height="22" aria-hidden>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <rect x="20" y="2" width="16" height="10" rx="3" />
        <path d="M28 12v8M10 20h36" />
        <path d="M10 20v4" />
        <path d="M46 20v4" />
        <rect x="2" y="24" width="16" height="10" rx="3" />
        <rect x="38" y="24" width="16" height="10" rx="3" />
      </g>
    </svg>
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

export function OrientationSwitch() {
  const orientation = useStore((s) => s.boardOrientation);
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
              onClick={() => useStore.getState().setBoardOrientation(opt.value)}
            >
              <opt.Icon />
            </button>
          );
        })}
      </div>
    </div>
  );
}
