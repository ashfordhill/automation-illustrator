/**
 * Alphabetical Step Type fat buttons; Other last (NA-05).
 */
import { STEP_KIND_META, STEP_KINDS, type StepKind } from "../../workflow/types";
import { StepKindIcon } from "../../board/tiles/StepKindIcon";

export function TypeButtons({
  value,
  onChange,
}: {
  value: StepKind;
  onChange: (kind: StepKind) => void;
}) {
  return (
    <div className="inspector-type-grid" role="group" aria-label="Type">
      {STEP_KINDS.map((kind) => {
        const label = STEP_KIND_META[kind].label;
        const on = value === kind;
        return (
          <button
            key={kind}
            type="button"
            className={`inspector-type${on ? " is-on" : ""}`}
            aria-pressed={on}
            aria-label={`Type ${label}`}
            onClick={() => onChange(kind)}
          >
            <span className="inspector-type-icon">
              <StepKindIcon kind={kind} />
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
