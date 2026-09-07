import { expect, test } from "vitest";
import { LABEL_MAX_LINES, LABEL_MAX_WIDTH, measureLabelBox, wrapConditionLines } from "./labelBox";

test("empty condition has a zero box", () => {
  expect(measureLabelBox("")).toEqual({ w: 0, h: 0, lines: [] });
  expect(measureLabelBox("   ")).toEqual({ w: 0, h: 0, lines: [] });
});

test("short conditions stay on one line under the max width", () => {
  const box = measureLabelBox("yes");
  expect(box.lines).toEqual(["yes"]);
  expect(box.w).toBeGreaterThan(0);
  expect(box.w).toBeLessThanOrEqual(LABEL_MAX_WIDTH);
});

test("long conditions wrap then clamp (CX-04)", () => {
  const text =
    "invoice amount is greater than fifty thousand dollars and needs extra review from accounts payable before anyone files the packet";
  const lines = wrapConditionLines(text);
  expect(lines.length).toBeGreaterThan(1);
  expect(lines.length).toBeLessThanOrEqual(LABEL_MAX_LINES);
  const box = measureLabelBox(text);
  expect(box.w).toBeLessThanOrEqual(LABEL_MAX_WIDTH);
  expect(box.lines[box.lines.length - 1]).toMatch(/…$/);
});
