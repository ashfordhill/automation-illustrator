import { expect, test } from "vitest";
import { parseCssColor, rgbToHex, rgbToOklch, roleChipFill, toHex } from "./color";

test("hex, rgb(), and hsl() parse to the same sRGB", () => {
  expect(rgbToHex(parseCssColor("#ff9fbf")!)).toBe("#ff9fbf");
  expect(rgbToHex(parseCssColor("#f9b")!)).toBe("#ff99bb");
  expect(rgbToHex(parseCssColor("rgb(255 159 191)")!)).toBe("#ff9fbf");
  expect(rgbToHex(parseCssColor("rgba(255, 159, 191, 0.5)")!)).toBe("#ff9fbf");
  expect(toHex("hsl(0 100% 50%)")).toBe("#ff0000");
  expect(toHex("hsl(120, 100%, 25%)")).toBe("#008000");
  expect(toHex("hsl(200 44% 84%)")).toBe(toHex("hsl(200deg 44% 84%)"));
  expect(parseCssColor("rebeccapurple")).toBeNull();
  expect(toHex("var(--x)")).toBe("var(--x)");
});

test("role chips floor OKLCH lightness at 0.86 and leave lighter fills alone", () => {
  const lifted = roleChipFill("#5ec4d8");
  expect(rgbToOklch(parseCssColor("#5ec4d8")!).l).toBeLessThan(0.86);
  expect(rgbToOklch(parseCssColor(lifted)!).l).toBeCloseTo(0.86, 2);
  expect(roleChipFill("#ffffff")).toBe("#ffffff");
  expect(roleChipFill("#f7fcfe")).toBe("#f7fcfe");
  expect(roleChipFill("not a color")).toBe("not a color");
});
