/**
 * Tall color card — fill opens a wheel, eyedropper below.
 * Shared by Manage actors and the Theme editor.
 */
import { useCallback, useState } from "react";
import { ColorPicker, Popover, type PopoverProps } from "@mantine/core";
import { IconColorPicker } from "@tabler/icons-react";
import { useEscapeClosesPopover } from "./useEscapeClosesPopover";

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };

export function ColorField({
  value,
  onChange,
  swatches,
  ariaLabel = "Color",
  accept,
  disabled = false,
  position = "left-start",
}: {
  value: string;
  onChange: (color: string) => void;
  swatches?: readonly string[];
  ariaLabel?: string;
  accept?: (color: string) => boolean;
  disabled?: boolean;
  position?: PopoverProps["position"];
}) {
  const [opened, setOpened] = useState(false);
  const close = useCallback(() => setOpened(false), []);
  useEscapeClosesPopover(opened, close);

  function commitColor(color: string) {
    const next = color.trim();
    if (!next) return;
    if (accept && !accept(next)) return;
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
          position={position}
          shadow="md"
          withArrow
          withinPortal
          hideDetached={false}
          middlewares={{ flip: true, shift: true, inline: false }}
          transitionProps={{ duration: 0 }}
          zIndex={450}
        >
          <Popover.Target>
            <button
              type="button"
              className="inspector-color-fill"
              aria-label={ariaLabel}
              aria-haspopup="dialog"
              aria-expanded={opened}
              disabled={disabled}
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
              swatches={swatches ? [...swatches] : undefined}
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
        disabled={disabled}
        onClick={() => void pickFromScreen()}
      >
        <IconColorPicker size={20} stroke={2.2} aria-hidden />
      </button>
    </div>
  );
}
