/**
 * Accessory toggles for the selected Human. The row is the catalog, so a new
 * accessory appears here once it is registered in workflow/accessories.ts.
 */
import { AccessoryGlyph } from "../../board/tiles/accessoryMarks";
import { ACCESSORIES, toggleAccessory } from "../../workflow/accessories";
import type { AccessoryKind } from "../../workflow/catalogs";

export function AccessoryPicker({
  accessories,
  onChange,
}: {
  accessories: readonly AccessoryKind[];
  onChange: (next: AccessoryKind[]) => void;
}) {
  return (
    <div className="inspector-accessories" role="group" aria-label="Accessories">
      {ACCESSORIES.map((item) => {
        const on = accessories.includes(item.kind);
        return (
          <button
            key={item.kind}
            type="button"
            className={`inspector-accessory${on ? " is-on" : ""}`}
            aria-pressed={on}
            aria-label={item.ariaLabel}
            onClick={() => onChange(toggleAccessory(accessories, item.kind))}
          >
            <AccessoryGlyph kind={item.kind} />
            <span className="inspector-accessory-label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
