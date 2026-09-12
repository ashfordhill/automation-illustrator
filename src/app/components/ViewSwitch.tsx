/**
 * Top-bar Before / After / Compare radios. Faces are Human, Robot, and the
 * orientation-aware Compare mark. Accessible names stay the view words (AQ-02).
 */
import { HumanFigure } from "../../board/tiles/HumanFigure";
import { RobotFigure } from "../../board/tiles/RobotFigure";
import { useStore } from "../../state/store";
import { VIEW_SWITCH_LABEL, ViewMode } from "../../workflow/catalogs";
import { CompareIcon } from "../icons/CompareIcon";

const VIEW_OPTIONS: Array<{ value: ViewMode; label: string }> = [
  { value: ViewMode.Before, label: VIEW_SWITCH_LABEL[ViewMode.Before] },
  { value: ViewMode.After, label: VIEW_SWITCH_LABEL[ViewMode.After] },
  { value: ViewMode.Both, label: VIEW_SWITCH_LABEL[ViewMode.Both] },
];

function ViewFace({ value }: { value: ViewMode }) {
  const orientation = useStore((s) => s.boardOrientation);
  if (value === ViewMode.Before) {
    return <HumanFigure size={22} color="currentColor" />;
  }
  if (value === ViewMode.After) {
    return <RobotFigure size={22} color="currentColor" />;
  }
  return <CompareIcon orientation={orientation} />;
}

export function ViewSwitch() {
  const view = useStore((s) => s.view);
  return (
    <div
      className="view-switch lane-switch"
      role="radiogroup"
      aria-label="Before, After, or Compare"
    >
      <div className="view-switch-track">
        {VIEW_OPTIONS.map((opt) => {
          const on = view === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-label={opt.label}
              aria-checked={on}
              title={opt.label}
              data-view-icon={opt.value}
              className={`view-switch-btn${on ? " is-on" : ""}`}
              onClick={() => useStore.getState().setView(opt.value)}
            >
              <ViewFace value={opt.value} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
