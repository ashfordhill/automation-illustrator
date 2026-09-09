/**
 * Alphabetical Step Type fat buttons; Other last, clipboard with no printed word (NA-05).
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
        return (
          <button
            key={kind}
            type="button"
            className={`inspector-type${on ? " is-on" : ""}`}
            aria-pressed={on}
            aria-label={`Type ${label}`}
            disabled={disabled}
            onClick={() => onChange(kind)}
          >
            <span className="inspector-type-icon">
              <StepKindIcon kind={kind} size={22} />
            </span>
            <span
              className={`inspector-type-name${kind === StepKind.Other ? " is-blank" : ""}`}
              aria-hidden={kind === StepKind.Other}
            >
              {kind === StepKind.Other ? "\u00a0" : label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
