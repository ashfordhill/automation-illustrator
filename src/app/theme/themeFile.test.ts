import { expect, test } from "vitest";
import { BUILTIN_THEMES, ICE_THEME } from "./chromeTheme";
import {
  parseThemeText,
  themeExportFilename,
  themeFileSchema,
  themeToYaml,
} from "./themeFile";

test("every built-in round-trips through YAML and the schema", () => {
  for (const preset of BUILTIN_THEMES) {
    const yaml = themeToYaml(preset);
    expect(yaml.startsWith("version: 1\n")).toBe(true);
    expect(yaml).toContain(`chrome: "${preset.colors.chrome}"`);
    expect(yaml.endsWith("\n")).toBe(true);
    const parsed = parseThemeText(yaml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) continue;
    expect(themeFileSchema.safeParse(parsed.theme).success).toBe(true);
    expect(parsed.theme.name).toBe(preset.name);
    expect(parsed.theme.colors).toEqual(preset.colors);
    expect(parsed.theme.texture).toEqual(preset.texture);
  }
});

test("JSON theme files import and uppercase hexes are lowered", () => {
  const json = JSON.stringify({
    version: 1,
    name: " Loud ",
    colors: { ...ICE_THEME.colors, chrome: "#ABCDEF" },
    texture: { pattern: "cross", color: "#AABBCC" },
  });
  const parsed = parseThemeText(json);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) return;
  expect(parsed.theme.name).toBe("Loud");
  expect(parsed.theme.colors.chrome).toBe("#abcdef");
  expect(parsed.theme.texture.color).toBe("#aabbcc");
});

test("invalid pattern, hex, version, or syntax is rejected", () => {
  const good = themeToYaml(ICE_THEME);
  expect(parseThemeText(good.replace("pattern: dots", "pattern: stripes")).ok).toBe(false);
  expect(parseThemeText(good.replace('"#0c3349"', '"#0c33"')).ok).toBe(false);
  expect(parseThemeText(good.replace('"#0c3349"', "navy")).ok).toBe(false);
  expect(parseThemeText(good.replace("version: 1", "version: 2")).ok).toBe(false);
  expect(parseThemeText(good.replace("name: Ice", "name: ''")).ok).toBe(false);
  expect(parseThemeText("colors: [").ok).toBe(false);
  expect(parseThemeText("just a string").ok).toBe(false);
  const bad = parseThemeText("");
  expect(bad.ok).toBe(false);
  if (!bad.ok) expect(bad.message).toBe("Theme file is not valid");
});

test("export filenames use the workflow slug rules with .theme.yaml", () => {
  expect(themeExportFilename("Ice")).toBe("ice.theme.yaml");
  expect(themeExportFilename("My theme")).toBe("my-theme.theme.yaml");
  expect(themeExportFilename("Crème brûlée!!")).toBe("creme-brulee.theme.yaml");
  expect(themeExportFilename("   ")).toBe("theme.theme.yaml");
});
