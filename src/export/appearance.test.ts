import { expect, test } from "vitest";
import { BUILTIN_THEMES, ICE_THEME, THEME_COLOR_KEYS } from "../app/theme/chromeTheme";
import { appearanceFor, DEFAULT_APPEARANCE, readAppearance } from "./appearance";

const FOREST = BUILTIN_THEMES.find((t) => t.id === "forest")!;

test("appearanceFor writes theme colors in the fixed key order", () => {
  const shuffled = {
    ...FOREST,
    colors: Object.fromEntries(Object.entries(FOREST.colors).reverse()) as typeof FOREST.colors,
  };
  const look = appearanceFor("vertical", shuffled);
  expect(Object.keys(look.theme.colors)).toEqual([...THEME_COLOR_KEYS]);
  expect(look).toEqual({
    orientation: "vertical",
    theme: { name: "Forest", colors: FOREST.colors, texture: FOREST.texture },
  });
  expect(look.theme).not.toHaveProperty("id");
});

test("readAppearance returns the header look", () => {
  const look = appearanceFor("vertical", FOREST);
  expect(readAppearance({ appearance: look })).toEqual(look);
});

test("a missing or broken part falls back to horizontal Ice, one part at a time", () => {
  expect(readAppearance({})).toEqual(DEFAULT_APPEARANCE);
  expect(readAppearance(null)).toEqual(DEFAULT_APPEARANCE);
  expect(DEFAULT_APPEARANCE).toEqual(appearanceFor("horizontal", ICE_THEME));

  const forest = appearanceFor("vertical", FOREST);
  const badTheme = readAppearance({
    appearance: { orientation: "vertical", theme: { ...forest.theme, colors: { paper: "nope" } } },
  });
  expect(badTheme).toEqual({ orientation: "vertical", theme: DEFAULT_APPEARANCE.theme });

  const badOrientation = readAppearance({ appearance: { orientation: "diagonal", theme: forest.theme } });
  expect(badOrientation).toEqual({ orientation: "horizontal", theme: forest.theme });
});
