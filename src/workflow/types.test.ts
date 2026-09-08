import { expect, test } from "vitest";
import { StepKind, nodeCaption, stepDisplayLabel, typePickerKinds } from "./types";
import type { StepNodeDto } from "./types";

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

test("Other on-tile copy is the Name only", () => {
  expect(stepDisplayLabel(StepKind.Other, "")).toBe("");
  expect(stepDisplayLabel(StepKind.Other, "File boxes")).toBe("File boxes");
  expect(stepDisplayLabel(StepKind.Other, "  File boxes  ")).toBe("File boxes");
  expect(stepDisplayLabel(StepKind.Email, "")).toBe("Email");
  expect(stepDisplayLabel(StepKind.Email, "invoice.pdf")).toBe("Email invoice.pdf");
});

test("unnamed Other nodeCaption is Step, not Other", () => {
  const unnamed: StepNodeDto = {
    id: "s1",
    type: "step",
    position: { x: 0, y: 0 },
    stepKind: StepKind.Other,
    title: "",
    detail: "",
    split: "exclusive",
  };
  expect(nodeCaption(unnamed)).toBe("Step");
  expect(nodeCaption({ ...unnamed, title: "File boxes" })).toBe("File boxes");
});
