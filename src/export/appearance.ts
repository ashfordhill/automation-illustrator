/**
 * The look a `.illustrator` header records: board orientation and the applied
 * theme, so a renderer draws the board the way the exporter saw it.
 * Import ignores it; the importer's own preferences stay in charge.
 */
import { z } from "zod";
import {
  ICE_THEME,
  THEME_COLOR_KEYS,
  themeColorsSchema,
  themeTextureSchema,
  type ThemeColors,
  type ThemePreset,
  type ThemeTexture,
} from "../app/theme/chromeTheme";
import type { BoardOrientation } from "../board/flow/flowProfile";

export type Appearance = {
  orientation: BoardOrientation;
  theme: { name: string; colors: ThemeColors; texture: ThemeTexture };
};

const orientationSchema = z.enum(["horizontal", "vertical"]);
const themeSchema = z.object({
  name: z.string().trim().min(1),
  colors: themeColorsSchema,
  texture: themeTextureSchema,
});

/** Keys in a fixed order so the same look writes the same bytes. */
export function appearanceFor(
  orientation: BoardOrientation,
  preset: Pick<ThemePreset, "name" | "colors" | "texture">,
): Appearance {
  const colors = {} as ThemeColors;
  for (const key of THEME_COLOR_KEYS) colors[key] = preset.colors[key];
  return {
    orientation,
    theme: {
      name: preset.name,
      colors,
      texture: { pattern: preset.texture.pattern, color: preset.texture.color },
    },
  };
}

export const DEFAULT_APPEARANCE: Appearance = appearanceFor("horizontal", ICE_THEME);

/** The header's look. A missing or unreadable orientation or theme falls back to horizontal / Ice. */
export function readAppearance(file: unknown): Appearance {
  const raw =
    file && typeof file === "object" ? (file as { appearance?: unknown }).appearance : undefined;
  const parts = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const orientation = orientationSchema.safeParse(parts.orientation);
  const theme = themeSchema.safeParse(parts.theme);
  return appearanceFor(
    orientation.success ? orientation.data : DEFAULT_APPEARANCE.orientation,
    theme.success ? theme.data : DEFAULT_APPEARANCE.theme,
  );
}
