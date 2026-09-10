/**
 * Compact inspector text: fixed Type chip on the left, Name/Details in a cream box.
 */
import { LONGEST_STEP_KIND_LABEL } from "../../workflow/types";

export function InspectorField({
  id,
  ariaLabel,
  prefix,
  prefixSlot,
  value,
  disabled,
  onChange,
}: {
  id: string;
  ariaLabel: string;
  prefix?: string;
  /** Keep a Type-width column so Name/Details stay the same length. */
  prefixSlot?: boolean;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const chip = Boolean(prefix);
  return (
    <div className={`inspector-field${disabled ? " is-off" : ""}`}>
      {prefixSlot ? (
        <span className={`inspector-field-prefix${chip ? " has-chip" : ""}`} aria-hidden="true">
          <span className="inspector-field-prefix-sizer">{LONGEST_STEP_KIND_LABEL}</span>
          <span className="inspector-field-prefix-label">{prefix ?? ""}</span>
        </span>
      ) : null}
      <div
        className="inspector-field-box"
        onClick={(e) => {
          if (disabled) return;
          if (e.target instanceof HTMLInputElement) return;
          e.currentTarget.querySelector("input")?.focus();
        }}
      >
        <input
          id={id}
          aria-label={ariaLabel}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
