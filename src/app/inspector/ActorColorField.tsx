/**
 * Compact actor Color: a short cream swatch plus a separate eyedropper (NA-01).
 */
import { useState } from "react";
import { ColorPicker, Popover } from "@mantine/core";
import { IconColorPicker } from "@tabler/icons-react";
import { ACTOR_COLOR_SWATCHES } from "../../workflow/actors";

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };

export function ActorColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const [opened, setOpened] = useState(false);

  async function pickFromScreen() {
    const Ctor = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper;
    if (!Ctor) {
      setOpened(true);
      return;
    }
    try {
      const { sRGBHex } = await new Ctor().open();
      if (sRGBHex?.trim()) onChange(sRGBHex);
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="inspector-color-row">
      <Popover
        opened={opened}
        onChange={setOpened}
        position="bottom-start"
        shadow="md"
        withArrow
        withinPortal
      >
        <Popover.Target>
          <button
            type="button"
            className="inspector-color-chip"
            aria-label="Color"
            aria-expanded={opened}
          >
            <span className="inspector-color-chip-fill" style={{ background: value }} />
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
      <button
        type="button"
        className="inspector-color-dropper"
        aria-label="Eyedropper"
        onClick={() => void pickFromScreen()}
      >
        <IconColorPicker size={20} stroke={2.2} aria-hidden />
      </button>
    </div>
  );
}
