import { afterEach, expect, test } from "vitest";
import {
  BUILTIN_THEMES,
  CHROME_THEME_DEFAULTS,
  ICE_THEME,
  applyChromeTheme,
  chromeThemesEqual,
  clearChromeThemeOverrides,
  derivedTextureColor,
  derivedWell,
  legacyThemeToBody,
  mixSrgb,
  onYellowFor,
  parseChromeTheme,
  parseHexRgb,
  relativeLuminance,
  themeBodiesEqual,
  themeCssVars,
  uniqueThemeName,
} from "./chromeTheme";

afterEach(() => {
  clearChromeThemeOverrides();
});

test("Ice well and texture equal the Improvement 65 color-mix recipes", () => {
  expect(derivedWell(ICE_THEME.colors.chrome)).toBe(ICE_THEME.colors.chromeWell);
  expect(derivedTextureColor(ICE_THEME.colors.paper, ICE_THEME.colors.chrome)).toBe(
    ICE_THEME.texture.color,
  );
  const well = mixSrgb(CHROME_THEME_DEFAULTS.chrome, "#000000", 0.62);
  const wellRgb = parseHexRgb(well!);
  const shippedWell = parseHexRgb("#071f2e");
  expect(Math.abs(wellRgb![0] - shippedWell![0])).toBeLessThanOrEqual(3);
  expect(Math.abs(wellRgb![1] - shippedWell![1])).toBeLessThanOrEqual(3);
  expect(Math.abs(wellRgb![2] - shippedWell![2])).toBeLessThanOrEqual(3);

  const fold = mixSrgb(CHROME_THEME_DEFAULTS.chromeInk, CHROME_THEME_DEFAULTS.chrome, 0.22);
  expect(fold).toBe("#3f5f71");
});

test("built-ins are four distinct presets with lowercase hexes and Ice first", () => {
  expect(BUILTIN_THEMES.map((t) => t.id)).toEqual(["ice", "graphite", "forest", "plum"]);
  for (const t of BUILTIN_THEMES) {
    for (const hex of [...Object.values(t.colors), t.texture.color]) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    }
    // Every built-in keeps dark on-yellow for the shared Type / Who fill.
    expect(onYellowFor(t.colors.yellow, t.colors.chromeInk)).toBe("#071c28");
  }
});

test("default yellow is light enough to keep dark on-yellow", () => {
  const lum = relativeLuminance(CHROME_THEME_DEFAULTS.yellow);
  expect(lum).toBeGreaterThan(0.35);
  expect(onYellowFor("#1a1020", "#f3fbfe")).toBe("#f3fbfe");
});

test("parseChromeTheme fills defaults and legacyThemeToBody adds well and texture", () => {
  expect(parseChromeTheme(null)).toEqual(CHROME_THEME_DEFAULTS);
  expect(parseChromeTheme({ chrome: "nope" })).toEqual(CHROME_THEME_DEFAULTS);
  expect(parseChromeTheme({ chrome: "#ABC" }).chrome).toBe("#aabbcc");
  expect(chromeThemesEqual(parseChromeTheme({}), CHROME_THEME_DEFAULTS)).toBe(true);
  const body = legacyThemeToBody(CHROME_THEME_DEFAULTS);
  expect(themeBodiesEqual(body, ICE_THEME)).toBe(true);
  const red = legacyThemeToBody({ ...CHROME_THEME_DEFAULTS, chrome: "#802020" });
  expect(red.colors.chromeWell).toBe(mixSrgb("#802020", "#000000", 0.62));
  expect(red.texture.pattern).toBe("dots");
});

test("applyChromeTheme writes every variable; Ice clears the overrides", () => {
  const custom = {
    colors: { ...ICE_THEME.colors, chrome: "#802020", chromeWell: "#111111" },
    texture: { pattern: "mesh" as const, color: "#cccccc" },
  };
  applyChromeTheme(custom);
  const root = document.documentElement.style;
  expect(root.getPropertyValue("--chrome")).toBe("#802020");
  expect(root.getPropertyValue("--chrome-well")).toBe("#111111");
  expect(root.getPropertyValue("--grid-dot")).toBe("#cccccc");
  expect(root.getPropertyValue("--on-yellow")).toBe("#071c28");
  applyChromeTheme(ICE_THEME);
  expect(root.getPropertyValue("--chrome")).toBe("");
  expect(root.getPropertyValue("--chrome-well")).toBe("");
  expect(root.getPropertyValue("--grid-dot")).toBe("");
  expect(Object.keys(themeCssVars(ICE_THEME))).toEqual([
    "--chrome",
    "--chrome-well",
    "--chrome-btn",
    "--chrome-line",
    "--chrome-ink",
    "--yellow",
    "--paper",
    "--grid-dot",
    "--on-yellow",
  ]);
});

test("uniqueThemeName suffixes 2, 3… case-insensitively", () => {
  expect(uniqueThemeName("Ice", ["Graphite"])).toBe("Ice");
  expect(uniqueThemeName("Ice", ["ice"])).toBe("Ice 2");
  expect(uniqueThemeName("Ice", ["Ice", "Ice 2"])).toBe("Ice 3");
  expect(uniqueThemeName("   ", [])).toBe("Theme");
});
