/**
 * Compact actor Color: cream chip plus eyedropper that opens the wheel (NA-01).
 */
import { ColorPicker, Popover } from "@mantine/core";
import { IconColorPicker } from "@tabler/icons-react";
import { ACTOR_COLOR_SWATCHES } from "../../workflow/actors";

export function ActorColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <Popover position="bottom-start" shadow="md" withArrow>
      <Popover.Target>
        <button type="button" className="inspector-color" aria-label="Color">
          <span className="inspector-color-swatch" style={{ background: value }} />
          <IconColorPicker size={18} stroke={2.2} aria-hidden />
        </button>
      </Popover.Target>
      <Popover.Dropdown className="inspector-color-pop">
        <ColorPicker
          format="hex"
          value={value}
          onChange={(color) => {
            if (!color.trim()) return;
            onChange(color);
          }}
          swatches={[...ACTOR_COLOR_SWATCHES]}
          swatchesPerRow={7}
          withPicker
        />
      </Popover.Dropdown>
    </Popover>
  );
}
