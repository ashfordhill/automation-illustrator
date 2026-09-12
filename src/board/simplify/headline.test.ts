import { expect, test } from "vitest";
import { SplitKind, StepKind, WorkflowNodeKind } from "../../workflow/catalogs";
import { STEP_W } from "../layout/tileMetrics";
import {
  firstHeadlineLine,
  measureSimplifyOval,
  QUESTION_OVAL_MIN_W,
  simplifyHeadline,
  simplifyScreenFontPx,
  wordWebNodeSize,
} from "./headline";

test("firstHeadlineLine takes the first trimmed line", () => {
  expect(firstHeadlineLine("Review papers")).toBe("Review papers");
  expect(firstHeadlineLine("Review papers\nmore")).toBe("Review papers");
  expect(firstHeadlineLine("  \nnext")).toBe("");
});

test("simplifyHeadline uses Type + Name; empty Other is ?", () => {
  expect(
    simplifyHeadline({
      id: "s1",
      type: WorkflowNodeKind.Step,
      position: { x: 0, y: 0 },
      stepKind: StepKind.Review,
      title: "papers",
      detail: "ignored",
      split: SplitKind.Parallel,
    }),
  ).toBe("Review papers");
  expect(
    simplifyHeadline({
      id: "s2",
      type: WorkflowNodeKind.Step,
      position: { x: 0, y: 0 },
      stepKind: StepKind.Other,
      title: "",
      detail: "",
      split: SplitKind.Parallel,
    }),
  ).toBe("?");
  expect(
    simplifyHeadline({
      id: "d1",
      type: WorkflowNodeKind.DataField,
      position: { x: 0, y: 0 },
      label: "",
    }),
  ).toBe("Data");
});

test("simplifyScreenFontPx stays a large screen size at every zoom", () => {
  expect(simplifyScreenFontPx(1)).toBe(40);
  expect(simplifyScreenFontPx(0.4)).toBe(40);
  expect(simplifyScreenFontPx(0.2, "data")).toBe(28);
});

test("measureSimplifyOval is flow-sized at the design font and ignores zoom", () => {
  const atOne = measureSimplifyOval("Read invoice.pdf", 1, "step");
  const zoomedOut = measureSimplifyOval("Read invoice.pdf", 0.4, "step");
  expect(atOne).toEqual(zoomedOut);
  expect(atOne.font).toBe(40);
  expect(atOne.w).toBeGreaterThanOrEqual(STEP_W);
  expect(atOne.h).toBeGreaterThan(20);
});

test("empty Other ? has a real min box", () => {
  const oval = measureSimplifyOval("?", 1, "step");
  expect(oval.w).toBeGreaterThanOrEqual(QUESTION_OVAL_MIN_W);
  const node = wordWebNodeSize({
    id: "s2",
    type: WorkflowNodeKind.Step,
    position: { x: 0, y: 0 },
    stepKind: StepKind.Other,
    title: "",
    detail: "",
    split: SplitKind.Parallel,
  });
  expect(node.w).toBe(oval.w);
  expect(node.h).toBe(oval.h);
});
