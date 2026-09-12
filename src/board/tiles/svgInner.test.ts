import { expect, test } from "vitest";
import { svgInner } from "./svgInner";

test("svgInner returns the children of a standalone SVG", () => {
  expect(
    svgInner(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">\n  <circle cx="5" cy="5" r="4" />\n</svg>\n`,
    ),
  ).toBe('<circle cx="5" cy="5" r="4" />');
});

test("svgInner rejects markup that is not an SVG document", () => {
  expect(() => svgInner("<circle />")).toThrow(/complete/);
});
