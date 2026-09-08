/**
 * Alphabetical Step Type fat buttons; Other last (NA-05).
 */
import { STEP_KIND_META, StepKind, typePickerKinds } from "../../workflow/types";
import { StepKindIcon } from "../../board/tiles/StepKindIcon";

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
            className={`inspector-type${on ? " is-on" : ""}`}
            aria-pressed={on}
            aria-label={`Type ${label}`}
            disabled={disabled}
            onClick={() => onChange(kind)}
          >
            <span
              className={other ? undefined : "inspector-type-icon"}
              style={
                other
                  ? {
                      width: 30,
                      height: 30,
                      flex: "0 0 30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }
                  : undefined
              }
            >
              <StepKindIcon kind={kind} size={other ? 30 : 52} />
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
