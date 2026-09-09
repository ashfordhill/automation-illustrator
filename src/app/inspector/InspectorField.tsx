/**
 * Compact inspector text: Type prefix + underline for Name, empty box for Details.
 */
export function InspectorField({
  id,
  ariaLabel,
  prefix,
  value,
  disabled,
  onChange,
  lined = true,
}: {
  id: string;
  ariaLabel: string;
  prefix?: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  lined?: boolean;
}) {
  return (
    <div
      className={`inspector-field${lined ? " is-lined" : " is-plain"}${disabled ? " is-off" : ""}`}
      onClick={(e) => {
        if (disabled) return;
        if (e.target instanceof HTMLInputElement) return;
        e.currentTarget.querySelector("input")?.focus();
      }}
    >
      {prefix ? (
        <span className="inspector-field-prefix" aria-hidden="true">
          {prefix}
        </span>
      ) : null}
      <input
        id={id}
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
