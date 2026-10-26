import { expect, test } from "vitest";
import { resolveCssVars } from "./boardTokens";

test("resolveCssVars swaps known variables and leaves the rest", () => {
  expect(resolveCssVars('fill="var(--ink)" stroke="var(--nope)"', { "--ink": "#000" })).toBe(
    'fill="#000" stroke="var(--nope)"',
  );
});
