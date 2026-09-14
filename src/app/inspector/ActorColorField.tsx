/**
 * Compact actor Color: a tall card — fill on top, eyedropper below (NA-01).
 * The fill opens a wheel plus presets that are not the default roster colors.
 */
import { ACTOR_COLOR_SWATCHES, isBlankActorFill } from "../../workflow/actors";
import { ColorField } from "../theme/ColorField";

export function ActorColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <ColorField
      value={value}
      onChange={onChange}
      swatches={ACTOR_COLOR_SWATCHES}
      accept={(color) => !isBlankActorFill(color)}
    />
  );
}
