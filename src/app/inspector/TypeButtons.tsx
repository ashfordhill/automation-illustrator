/**
 * Alphabetical Step Type keys in a 3×3 plus a tall Other on the right (NA-05).
 */
import { STEP_KIND_META, StepKind, typePickerKinds } from "../../workflow/types";
import { StepKindIcon } from "../../board/tiles/StepKindIcon";
import "./TypeButtons.css";

export function TypeButtons({
  value,
  onChange,
  disabled,
}: {
  value: StepKind;
  onChange: (kind: StepKind) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inspector-type-grid" role="group" aria-label="Type">
      {typePickerKinds(value).map((kind) => {
        const label = STEP_KIND_META[kind].label;
        const on = value === kind;
        const other = kind === StepKind.Other;
        return (
          <button
            key={kind}
            type="button"
            className={`inspector-type${on ? " is-on" : ""}${other ? " is-other" : ""}`}
            aria-pressed={on}
            aria-label={`Type ${label}`}
            disabled={disabled}
            onClick={() => onChange(kind)}
          >
            <span className="inspector-type-icon">
              <StepKindIcon kind={kind} size={other ? 34 : 22} />
            </span>
            {other ? null : <span className="inspector-type-name">{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
