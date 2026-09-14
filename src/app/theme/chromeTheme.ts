/**
 * Chrome / paper themes (Improvements 65, 66).
 * A theme is a named preset: seven hexes plus a paper texture (pattern + color).
 * Four built-ins live here; user presets persist in localStorage (persistence.ts).
 * The Theme window edits a draft; only Save writes the CSS variables on :root.
 */
import { z } from "zod";

export const THEME_COLOR_KEYS = [
  "chrome",
  "chromeWell",
  "chromeBtn",
  "chromeLine",
  "chromeInk",
  "yellow",
  "paper",
] as const;

export type ThemeColorKey = (typeof THEME_COLOR_KEYS)[number];

export type ThemeColors = Record<ThemeColorKey, string>;

export const TEXTURE_PATTERNS = ["dots", "rings", "cross", "mesh"] as const;

export type TexturePattern = (typeof TEXTURE_PATTERNS)[number];

export type ThemeTexture = { pattern: TexturePattern; color: string };

/** What a preset stores and what the Theme window edits as a draft. */
export type ThemeBody = { colors: ThemeColors; texture: ThemeTexture };

export type ThemePreset = ThemeBody & { id: string; name: string };

/** Improvement 65 shape: six hexes without a well or texture. Migrated on load. */
export const LEGACY_CHROME_THEME_KEYS = [
  "chrome",
  "chromeBtn",
  "chromeLine",
  "chromeInk",
  "yellow",
  "paper",
] as const;

export type LegacyChromeThemeKey = (typeof LEGACY_CHROME_THEME_KEYS)[number];

export type LegacyChromeTheme = Record<LegacyChromeThemeKey, string>;

export const THEME_CSS_VARS: Record<ThemeColorKey, string> = {
  chrome: "--chrome",
  chromeWell: "--chrome-well",
  chromeBtn: "--chrome-btn",
  chromeLine: "--chrome-line",
  chromeInk: "--chrome-ink",
  yellow: "--yellow",
  paper: "--paper",
};

/** Texture color keeps the historical variable name so board CSS is unchanged. */
export const TEXTURE_CSS_VAR = "--grid-dot";

export const ON_YELLOW_DARK = "#071c28";
export const ON_YELLOW_LUMINANCE_FLOOR = 0.35;

export const THEME_COLOR_SWATCHES = [
  "#802020",
  "#1a5c3a",
  "#5b2d8e",
  "#8a5a12",
  "#0c3349",
  "#e8c14a",
] as const;

export const DEFAULT_THEME_ID = "ice";

export const CUSTOM_THEME_ID_PREFIX = "custom-";

export const BUILTIN_THEMES: readonly ThemePreset[] = [
  {
    id: "ice",
    name: "Ice",
    colors: {
      chrome: "#0c3349",
      chromeWell: "#07202d",
      chromeBtn: "#f7fcfe",
      chromeLine: "#5ec8e8",
      chromeInk: "#f3fbfe",
      yellow: "#e8c14a",
      paper: "#e8f4fa",
    },
    texture: { pattern: "dots", color: "#aabec8" },
  },
  {
    id: "graphite",
    name: "Graphite",
    colors: {
      chrome: "#2b2b30",
      chromeWell: "#1b1b1e",
      chromeBtn: "#f4f2ee",
      chromeLine: "#8a8f98",
      chromeInk: "#f1efe9",
      yellow: "#f0b429",
      paper: "#f3f0ea",
    },
    texture: { pattern: "mesh", color: "#cfcac0" },
  },
  {
    id: "forest",
    name: "Forest",
    colors: {
      chrome: "#16382b",
      chromeWell: "#0e231b",
      chromeBtn: "#f5f9f2",
      chromeLine: "#7fc9a1",
      chromeInk: "#eef7f0",
      yellow: "#ecc94b",
      paper: "#edf5ea",
    },
    texture: { pattern: "cross", color: "#b8cdb4" },
  },
  {
    id: "plum",
    name: "Plum",
    colors: {
      chrome: "#3a2450",
      chromeWell: "#241632",
      chromeBtn: "#fbf7ff",
      chromeLine: "#c39bea",
      chromeInk: "#f6f0fc",
      yellow: "#f2c14e",
      paper: "#f1eaf8",
    },
    texture: { pattern: "rings", color: "#c9b9dc" },
  },
];

export const ICE_THEME: ThemePreset = BUILTIN_THEMES[0]!;

/** Kept for callers that still think in the six Improvement 65 hexes. */
export const CHROME_THEME_DEFAULTS: LegacyChromeTheme = {
  chrome: ICE_THEME.colors.chrome,
  chromeBtn: ICE_THEME.colors.chromeBtn,
  chromeLine: ICE_THEME.colors.chromeLine,
  chromeInk: ICE_THEME.colors.chromeInk,
  yellow: ICE_THEME.colors.yellow,
  paper: ICE_THEME.colors.paper,
};

export const hexSchema = z.string().regex(/^#([0-9a-fA-F]{6})$/);

export const themeColorsSchema = z.object({
  chrome: hexSchema,
  chromeWell: hexSchema,
  chromeBtn: hexSchema,
  chromeLine: hexSchema,
  chromeInk: hexSchema,
  yellow: hexSchema,
  paper: hexSchema,
});

export const themeTextureSchema = z.object({
  pattern: z.enum(TEXTURE_PATTERNS),
  color: hexSchema,
});

export const themeBodySchema = z.object({
  colors: themeColorsSchema,
  texture: themeTextureSchema,
});

export const themePresetSchema = themeBodySchema.extend({
  id: z.string().min(1),
  name: z.string().min(1),
});

export function isBuiltinThemeId(id: string): boolean {
  return BUILTIN_THEMES.some((t) => t.id === id);
}

export function normalizeHex(value: string): string | null {
  const raw = value.trim();
  const m3 = raw.match(/^#([0-9a-fA-F]{3})$/);
  if (m3) {
    const [r, g, b] = m3[1]!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  const m6 = raw.match(/^#([0-9a-fA-F]{6})$/);
  return m6 ? `#${m6[1]!.toLowerCase()}` : null;
}

export function parseHexRgb(hex: string): [number, number, number] | null {
  const n = normalizeHex(hex);
  if (!n) return null;
  return [
    Number.parseInt(n.slice(1, 3), 16),
    Number.parseInt(n.slice(3, 5), 16),
    Number.parseInt(n.slice(5, 7), 16),
  ];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/** `amountA` is the weight of `a` (0–1), matching CSS color-mix(in srgb, a N%, b). */
export function mixSrgb(a: string, b: string, amountA: number): string | null {
  const pa = parseHexRgb(a);
  const pb = parseHexRgb(b);
  if (!pa || !pb) return null;
  const t = amountA;
  return rgbToHex(
    pa[0] * t + pb[0] * (1 - t),
    pa[1] * t + pb[1] * (1 - t),
    pa[2] * t + pb[2] * (1 - t),
  );
}

export function relativeLuminance(hex: string): number | null {
  const rgb = parseHexRgb(hex);
  if (!rgb) return null;
  const chan = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * chan(rgb[0]) + 0.7152 * chan(rgb[1]) + 0.0722 * chan(rgb[2]);
}

export function onYellowFor(yellow: string, chromeInk: string): string {
  const lum = relativeLuminance(yellow);
  if (lum === null || lum >= ON_YELLOW_LUMINANCE_FLOOR) return ON_YELLOW_DARK;
  return normalizeHex(chromeInk) ?? ICE_THEME.colors.chromeInk;
}

/** The Improvement 65 well recipe: chrome 62% + black. */
export function derivedWell(chrome: string): string {
  return mixSrgb(chrome, "#000000", 0.62) ?? ICE_THEME.colors.chromeWell;
}

/** The Improvement 65 grid-dot recipe: paper 72% + chrome. */
export function derivedTextureColor(paper: string, chrome: string): string {
  return mixSrgb(paper, chrome, 0.72) ?? ICE_THEME.texture.color;
}

export function cloneThemeBody(body: ThemeBody): ThemeBody {
  return { colors: { ...body.colors }, texture: { ...body.texture } };
}

export function themeBodyOf(preset: ThemePreset): ThemeBody {
  return cloneThemeBody(preset);
}

export function themeColorsEqual(a: ThemeColors, b: ThemeColors): boolean {
  return THEME_COLOR_KEYS.every((key) => a[key].toLowerCase() === b[key].toLowerCase());
}

export function themeBodiesEqual(a: ThemeBody, b: ThemeBody): boolean {
  return (
    themeColorsEqual(a.colors, b.colors) &&
    a.texture.pattern === b.texture.pattern &&
    a.texture.color.toLowerCase() === b.texture.color.toLowerCase()
  );
}

export function themePresetsEqual(a: ThemeBody, b: ThemeBody): boolean {
  return themeBodiesEqual(a, b);
}

export function chromeThemesEqual(a: LegacyChromeTheme, b: LegacyChromeTheme): boolean {
  return LEGACY_CHROME_THEME_KEYS.every(
    (key) => a[key].toLowerCase() === b[key].toLowerCase(),
  );
}

/** Lenient read of the Improvement 65 hex map; blanks fall back to Ice. */
export function parseChromeTheme(raw: unknown): LegacyChromeTheme {
  if (typeof raw !== "object" || raw === null) return { ...CHROME_THEME_DEFAULTS };
  const next = { ...CHROME_THEME_DEFAULTS };
  for (const key of LEGACY_CHROME_THEME_KEYS) {
    const hex = normalizeHex(String((raw as Record<string, unknown>)[key] ?? ""));
    if (hex) next[key] = hex;
  }
  return next;
}

/** Improvement 65 hex map → preset body with the derived well and dot color made explicit. */
export function legacyThemeToBody(legacy: LegacyChromeTheme): ThemeBody {
  return {
    colors: {
      chrome: legacy.chrome,
      chromeWell: derivedWell(legacy.chrome),
      chromeBtn: legacy.chromeBtn,
      chromeLine: legacy.chromeLine,
      chromeInk: legacy.chromeInk,
      yellow: legacy.yellow,
      paper: legacy.paper,
    },
    texture: { pattern: "dots", color: derivedTextureColor(legacy.paper, legacy.chrome) },
  };
}

/** Every variable a theme sets, for :root (Save) or the preview island (draft). */
export function themeCssVars(body: ThemeBody): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const key of THEME_COLOR_KEYS) {
    vars[THEME_CSS_VARS[key]] = body.colors[key];
  }
  vars[TEXTURE_CSS_VAR] = body.texture.color;
  vars["--on-yellow"] = onYellowFor(body.colors.yellow, body.colors.chromeInk);
  return vars;
}

function rootStyle(): CSSStyleDeclaration | null {
  return typeof document === "undefined" ? null : document.documentElement.style;
}

/**
 * Write a theme onto :root. Ice clears every override so the stylesheet
 * defaults (and the dark scheme tokens tests still switch to) stay authoritative.
 */
export function applyChromeTheme(
  body: ThemeBody,
  root: CSSStyleDeclaration | null = rootStyle(),
): void {
  if (!root) return;
  if (themeBodiesEqual(body, ICE_THEME)) {
    clearChromeThemeOverrides(root);
    return;
  }
  for (const [name, value] of Object.entries(themeCssVars(body))) {
    root.setProperty(name, value);
  }
}

export function clearChromeThemeOverrides(
  root: CSSStyleDeclaration | null = rootStyle(),
): void {
  if (!root) return;
  for (const key of THEME_COLOR_KEYS) {
    root.removeProperty(THEME_CSS_VARS[key]);
  }
  root.removeProperty(TEXTURE_CSS_VAR);
  root.removeProperty("--on-yellow");
}

/** "Ice" → "Ice", then "Ice 2", "Ice 3"… until it is unique among `taken` (case-insensitive). */
export function uniqueThemeName(name: string, taken: Iterable<string>): string {
  const base = name.trim() || "Theme";
  const seen = new Set(Array.from(taken, (n) => n.trim().toLowerCase()));
  if (!seen.has(base.toLowerCase())) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base} ${n}`;
    if (!seen.has(candidate.toLowerCase())) return candidate;
  }
}

export function themeNameTaken(name: string, presets: readonly ThemePreset[]): boolean {
  const wanted = name.trim().toLowerCase();
  return presets.some((p) => p.name.trim().toLowerCase() === wanted);
}
