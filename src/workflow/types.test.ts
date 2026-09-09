import { expect, test } from "vitest";
import {
  STEP_KIND_META,
  StepKind,
  nodeCaption,
  projectDisplayName,
  stepDisplayLabel,
  titleForStepKindChange,
  typePickerKinds,
} from "./types";
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
  expect(stepDisplayLabel(StepKind.Other, "Task")).toBe("Task");
  expect(stepDisplayLabel(StepKind.Other, "File boxes")).toBe("File boxes");
  expect(stepDisplayLabel(StepKind.Other, "  File boxes  ")).toBe("File boxes");
  expect(stepDisplayLabel(StepKind.Email, "")).toBe("Email");
  expect(stepDisplayLabel(StepKind.Email, "invoice.pdf")).toBe("Email invoice.pdf");
});

test("Other does not seed a Name; a typed Name is kept", () => {
  expect(STEP_KIND_META[StepKind.Other].defaultTitle).toBe("");
  expect(titleForStepKindChange(StepKind.Other, StepKind.Read, "")).toBe("");
  expect(titleForStepKindChange(StepKind.Other, StepKind.Read, "invoice.pdf")).toBe("invoice.pdf");
  expect(titleForStepKindChange(StepKind.Other, StepKind.Other, "")).toBe("");
  expect(titleForStepKindChange(StepKind.Email, StepKind.Other, "Task")).toBe("Task");
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
  expect(nodeCaption({ ...unnamed, title: "Task" })).toBe("Task");
  expect(nodeCaption({ ...unnamed, title: "File boxes" })).toBe("File boxes");
});

test("projectDisplayName is Untitled when the document has no title", () => {
  expect(projectDisplayName({})).toBe("Untitled");
  expect(projectDisplayName({ name: "" })).toBe("Untitled");
  expect(projectDisplayName({ name: "  " })).toBe("Untitled");
  expect(projectDisplayName({ name: "Oak Park Invoice" })).toBe("Oak Park Invoice");
});
