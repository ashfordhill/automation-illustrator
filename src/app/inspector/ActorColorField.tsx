/**
 * Compact actor Color: a tall card — fill on top, eyedropper below (NA-01).
 * The fill opens a wheel plus presets that are not the default roster colors.
 */
import { useState } from "react";
import { ColorPicker, Popover } from "@mantine/core";
import { IconColorPicker } from "@tabler/icons-react";
import { ACTOR_COLOR_SWATCHES, isBlankActorFill } from "../../workflow/actors";

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };

export function ActorColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const [opened, setOpened] = useState(false);

  function commitColor(color: string) {
    const next = color.trim();
    if (!next || isBlankActorFill(next)) return;
    if (next.toLowerCase() === value.trim().toLowerCase()) return;
    onChange(next);
  }

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
    <div className="inspector-color-card">
      <div className="inspector-color-fill-hit" style={{ background: value }}>
        <Popover
          opened={opened}
          onChange={setOpened}
          position="left-start"
          shadow="md"
          withArrow
          withinPortal
          hideDetached={false}
          middlewares={{ flip: true, shift: true, inline: false }}
          transitionProps={{ duration: 0 }}
          zIndex={400}
        >
          <Popover.Target>
            <button
              type="button"
              className="inspector-color-fill"
              aria-label="Color"
              aria-haspopup="dialog"
              aria-expanded={opened}
              style={{ background: value }}
              onClick={() => setOpened((o) => !o)}
            />
          </Popover.Target>
          <Popover.Dropdown className="inspector-color-pop">
          <ColorPicker
            format="hex"
            value={value}
            onChangeEnd={commitColor}
            onColorSwatchClick={commitColor}
            swatches={[...ACTOR_COLOR_SWATCHES]}
            swatchesPerRow={4}
            withPicker
          />
          </Popover.Dropdown>
        </Popover>
      </div>
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
