/**
 * Theme files (Improvement 66): YAML 1.2 like workflow files, JSON accepted.
 * Not part of the workflow document; WorkflowDoc and WORKFLOW_VERSION are untouched.
 */
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { z } from "zod";
import { filenameSlug, WORKFLOW_YAML_MIME } from "../../workflow/serialize";
import {
  themeColorsSchema,
  themeTextureSchema,
  type ThemeBody,
  type ThemePreset,
} from "./chromeTheme";

export const THEME_FILE_VERSION = 1;

export const THEME_FILE_EXTENSION = ".theme.yaml";

export const THEME_FILE_MIME = WORKFLOW_YAML_MIME;

export const themeFileSchema = z.object({
  version: z.literal(THEME_FILE_VERSION),
  name: z.string().trim().min(1),
  colors: themeColorsSchema,
  texture: themeTextureSchema,
});

export type ThemeFile = z.infer<typeof themeFileSchema>;

const YAML_STRINGIFY = { indent: 2, lineWidth: 0 } as const;

/** Pretty YAML for one preset's saved body. `#` hexes are quoted by the yaml package. */
export function themeToYaml(preset: Pick<ThemePreset, "name"> & ThemeBody): string {
  const file: ThemeFile = {
    version: THEME_FILE_VERSION,
    name: preset.name,
    colors: { ...preset.colors },
    texture: { ...preset.texture },
  };
  return `${stringifyYaml(file, YAML_STRINGIFY).trimEnd()}\n`;
}

export type ParseThemeResult =
  | { ok: true; theme: ThemeFile }
  | { ok: false; message: string };

/** Parse YAML or JSON text and validate it as a version 1 theme file. */
export function parseThemeText(raw: string): ParseThemeResult {
  let value: unknown;
  try {
    value = parseYaml(raw);
  } catch {
    return { ok: false, message: "Theme file is not valid" };
  }
  const parsed = themeFileSchema.safeParse(value);
  if (!parsed.success) return { ok: false, message: "Theme file is not valid" };
  const theme = parsed.data;
  return {
    ok: true,
    theme: {
      ...theme,
      colors: lowerHexes(theme.colors) as ThemeFile["colors"],
      texture: { pattern: theme.texture.pattern, color: theme.texture.color.toLowerCase() },
    },
  };
}

function lowerHexes<T extends Record<string, string>>(colors: T): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(colors)) out[k] = v.toLowerCase();
  return out;
}

/** "My theme" → my-theme.theme.yaml (same slug rules as workflow Export). */
export function themeExportFilename(name: string): string {
  return `${filenameSlug(name) || "theme"}${THEME_FILE_EXTENSION}`;
}
