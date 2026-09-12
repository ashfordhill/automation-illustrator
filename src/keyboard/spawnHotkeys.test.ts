import { expect, test } from "vitest";
import { KeyAction, WorkflowNodeKind } from "../workflow/catalogs";
import { ACTION_LABELS } from "./bindings";
import { actionLabel, spawnForAction } from "./spawnHotkeys";

test("horizontal Q/E spawn Step and A/D spawn Data", () => {
  expect(spawnForAction("horizontal", KeyAction.AddStepIn)).toEqual({
    type: WorkflowNodeKind.Step,
    side: "in",
  });
  expect(spawnForAction("horizontal", KeyAction.AddStepOut)).toEqual({
    type: WorkflowNodeKind.Step,
    side: "out",
  });
  expect(spawnForAction("horizontal", KeyAction.AddDataIn)).toEqual({
    type: WorkflowNodeKind.DataField,
    side: "in",
  });
  expect(spawnForAction("horizontal", KeyAction.AddDataOut)).toEqual({
    type: WorkflowNodeKind.DataField,
    side: "out",
  });
});

test("vertical Q/A spawn Step up/down and E/D spawn Data up/down", () => {
  expect(spawnForAction("vertical", KeyAction.AddStepIn)).toEqual({
    type: WorkflowNodeKind.Step,
    side: "in",
  });
  expect(spawnForAction("vertical", KeyAction.AddDataIn)).toEqual({
    type: WorkflowNodeKind.Step,
    side: "out",
  });
  expect(spawnForAction("vertical", KeyAction.AddStepOut)).toEqual({
    type: WorkflowNodeKind.DataField,
    side: "in",
  });
  expect(spawnForAction("vertical", KeyAction.AddDataOut)).toEqual({
    type: WorkflowNodeKind.DataField,
    side: "out",
  });
});

test("vertical keybind copy names the compass corners", () => {
  expect(actionLabel(KeyAction.AddStepIn, "vertical")).toBe("New Step above");
  expect(actionLabel(KeyAction.AddDataIn, "vertical")).toBe("New Step below");
  expect(actionLabel(KeyAction.AddStepOut, "vertical")).toBe("New Data above");
  expect(actionLabel(KeyAction.AddDataOut, "vertical")).toBe("New Data below");
  expect(actionLabel(KeyAction.AddStepIn, "horizontal")).toBe(ACTION_LABELS[KeyAction.AddStepIn]);
  expect(actionLabel(KeyAction.Undo, "vertical")).toBe(ACTION_LABELS[KeyAction.Undo]);
});
