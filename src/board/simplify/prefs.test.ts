import { expect, test } from "vitest";
import {
  applySimplifyPatch,
  DEFAULT_SIMPLIFY_PREFS,
  isSimplified,
  parseSimplifyPrefs,
  simplifyMenuActive,
} from "./prefs";

test("parseSimplifyPrefs defaults missing or invalid to all false", () => {
  expect(parseSimplifyPrefs(null)).toEqual(DEFAULT_SIMPLIFY_PREFS);
  expect(parseSimplifyPrefs("")).toEqual(DEFAULT_SIMPLIFY_PREFS);
  expect(parseSimplifyPrefs("nope")).toEqual(DEFAULT_SIMPLIFY_PREFS);
  expect(parseSimplifyPrefs({ hideVisuals: "yes" })).toEqual(DEFAULT_SIMPLIFY_PREFS);
});

test("parseSimplifyPrefs ignores withdrawn zoom-out and Hide data", () => {
  expect(
    parseSimplifyPrefs({
      hideVisualsOnZoomOut: true,
      hideVisuals: true,
      hideData: true,
    }),
  ).toEqual({
    hideVisuals: true,
  });
});

test("applySimplifyPatch toggles View independently", () => {
  const on = applySimplifyPatch(DEFAULT_SIMPLIFY_PREFS, { hideVisuals: true });
  expect(on.hideVisuals).toBe(true);
  expect(simplifyMenuActive(on)).toBe(true);
  const off = applySimplifyPatch(on, { hideVisuals: false });
  expect(simplifyMenuActive(off)).toBe(false);
});

test("isSimplified follows View (hideVisuals)", () => {
  expect(isSimplified(DEFAULT_SIMPLIFY_PREFS)).toBe(false);
  expect(isSimplified({ hideVisuals: true })).toBe(true);
});
