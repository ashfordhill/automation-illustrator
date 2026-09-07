import { expect, test } from "vitest";
import { StepKind, typePickerKinds } from "./types";

test("Type picker omits Scan, Drag, Approve, and File", () => {
  expect(typePickerKinds(StepKind.Read)).toEqual([
    StepKind.Call,
    StepKind.Copy,
    StepKind.Email,
    StepKind.Print,
    StepKind.Read,
    StepKind.Review,
    StepKind.Search,
    StepKind.Write,
    StepKind.Other,
  ]);
});

test("a retired Type still appears when the selected Step already has it", () => {
  const kinds = typePickerKinds(StepKind.Scan);
  expect(kinds).toContain(StepKind.Scan);
  expect(kinds.at(-1)).toBe(StepKind.Other);
  expect(kinds.indexOf(StepKind.Scan)).toBeLessThan(kinds.indexOf(StepKind.Search));
});
