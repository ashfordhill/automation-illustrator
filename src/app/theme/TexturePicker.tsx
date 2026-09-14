/**
 * Paper texture control for the Theme window (Improvement 66).
 * Left: a wide paper card showing the current pattern; click opens a 2×2
 * popover of pattern tiles. Right, joined: a tall ColorField for the texture color.
 */
import { useCallback, useState } from "react";
import { Popover } from "@mantine/core";
import { PaperTextureSvg } from "../../board/PaperTexture";
import { ColorField } from "./ColorField";
import { useEscapeClosesPopover } from "./useEscapeClosesPopover";
import {
  TEXTURE_PATTERNS,
  THEME_COLOR_SWATCHES,
  type TexturePattern,
  type ThemeTexture,
} from "./chromeTheme";

export const TEXTURE_PATTERN_LABELS: Record<TexturePattern, string> = {
  dots: "Dots",
  rings: "Rings",
  cross: "Cross",
  mesh: "Mesh",
};

export function TexturePicker({
  value,
  paper,
  onChange,
}: {
  value: ThemeTexture;
  paper: string;
  onChange: (patch: Partial<ThemeTexture>) => void;
}) {
  const [opened, setOpened] = useState(false);
  const close = useCallback(() => setOpened(false), []);
  useEscapeClosesPopover(opened, close);
  return (
    <div className="theme-texture">
      <div className="theme-texture-pair">
        <Popover
          opened={opened}
          onChange={setOpened}
          position="top-start"
          shadow="md"
          withArrow
          withinPortal
          middlewares={{ flip: true, shift: true, inline: false }}
          transitionProps={{ duration: 0 }}
          zIndex={450}
        >
          <Popover.Target>
            <button
              type="button"
              className="theme-texture-card"
              aria-label={`Texture pattern: ${TEXTURE_PATTERN_LABELS[value.pattern]}`}
              aria-haspopup="dialog"
              aria-expanded={opened}
              data-texture-pattern={value.pattern}
              style={{ background: paper }}
              onClick={() => setOpened((o) => !o)}
            >
              <PaperTextureSvg
                pattern={value.pattern}
                color={value.color}
                className="theme-texture-swatch"
              />
            </button>
          </Popover.Target>
          <Popover.Dropdown className="inspector-color-pop theme-texture-pop">
            <div className="theme-texture-grid" role="radiogroup" aria-label="Texture pattern">
              {TEXTURE_PATTERNS.map((pattern) => {
                const on = pattern === value.pattern;
                return (
                  <button
                    key={pattern}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={TEXTURE_PATTERN_LABELS[pattern]}
                    title={TEXTURE_PATTERN_LABELS[pattern]}
                    data-texture-option={pattern}
                    className={`theme-texture-tile${on ? " is-on" : ""}`}
                    style={{ background: paper }}
                    onClick={() => {
                      onChange({ pattern });
                      setOpened(false);
                    }}
                  >
                    <PaperTextureSvg
                      pattern={pattern}
                      color={value.color}
                      className="theme-texture-swatch"
                    />
                  </button>
                );
              })}
            </div>
          </Popover.Dropdown>
        </Popover>
        <ColorField
          value={value.color}
          onChange={(color) => onChange({ color })}
          swatches={THEME_COLOR_SWATCHES}
          ariaLabel="Texture color"
          position="top-start"
        />
      </div>
      <span className="theme-picker-caption">Texture</span>
    </div>
  );
}
