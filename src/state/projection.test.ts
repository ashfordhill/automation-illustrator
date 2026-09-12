import { expect, test } from "vitest";
import { projectAfter, projectBefore } from "./projection";
import { MAILROOM_IDS, robotMailroom } from "../demos/robotMailroom";
import { oakParkInvoice } from "../demos/oakParkInvoice";
import { AssignmentLane } from "../workflow/catalogs";

test("projectBefore is the base graph", () => {
  const doc = robotMailroom();
  const before = projectBefore(doc);
  expect(before.lane).toBe(AssignmentLane.Before);
  expect(before.nodes.map((n) => n.id)).toEqual(doc.nodes.map((n) => n.id));
  expect(before.edges.map((e) => e.id)).toEqual(doc.edges.map((e) => e.id));
  expect(before.nodes.some((n) => n.id === MAILROOM_IDS.receipt)).toBe(false);
  expect(before.edges.some((e) => e.id === MAILROOM_IDS.extra)).toBe(false);
});

test("After projection is 1:1 with Before", () => {
  for (const doc of [oakParkInvoice(), robotMailroom()]) {
    const before = projectBefore(doc);
    const after = projectAfter(doc);
    expect(after.nodes.map((n) => n.id)).toEqual(before.nodes.map((n) => n.id));
    expect(after.edges.map((e) => e.id)).toEqual(before.edges.map((e) => e.id));
    expect(after.nodes.every((n) => n.projectedKind === "base")).toBe(true);
  }
});
