import { expect, test } from "vitest";
import { projectAfter, projectBefore, supportingInternalIds } from "./projection";
import { MAILROOM_IDS, robotMailroom } from "../demos/robotMailroom";
import { oakParkInvoice } from "../demos/oakParkInvoice";
import { AssignmentLane } from "../workflow/catalogs";

test("projectBefore is the base graph and never includes After-only data", () => {
  const doc = robotMailroom();
  const before = projectBefore(doc);
  expect(before.lane).toBe(AssignmentLane.Before);
  expect(before.nodes.map((n) => n.id)).toEqual(doc.nodes.map((n) => n.id));
  expect(before.edges.map((e) => e.id)).toEqual(doc.edges.map((e) => e.id));
  expect(before.nodes.some((n) => n.id === MAILROOM_IDS.receipt)).toBe(false);
  expect(before.edges.some((e) => e.id === MAILROOM_IDS.extra)).toBe(false);
  expect(before.nodes.some((n) => n.id === MAILROOM_IDS.group)).toBe(false);
});

test("Oak Park After projection matches Before when the overlay has no extras or groups", () => {
  const doc = oakParkInvoice();
  const after = projectAfter(doc);
  expect(after.nodes.map((n) => n.id).sort()).toEqual(doc.nodes.map((n) => n.id).sort());
  expect(after.edges.map((e) => e.id).sort()).toEqual(doc.edges.map((e) => e.id).sort());
});

test("projectAfter remaps group endpoints, hides internals, and keeps parallel conditions", () => {
  const doc = robotMailroom();
  const id = MAILROOM_IDS;
  expect(supportingInternalIds(doc.after.groups[0]!.memberIds, doc.nodes, doc.edges)).toEqual([
    id.recipient,
  ]);

  const after = projectAfter(doc);
  expect(after.nodes.some((n) => n.id === id.scan)).toBe(false);
  expect(after.nodes.some((n) => n.id === id.lookup)).toBe(false);
  expect(after.nodes.some((n) => n.id === id.route)).toBe(false);
  expect(after.nodes.some((n) => n.id === id.recipient)).toBe(false);

  const group = after.nodes.find((n) => n.id === id.group);
  expect(group?.projectedKind).toBe("group");
  expect(group?.memberIds).toEqual([id.scan, id.lookup, id.route]);

  expect(after.edges.some((e) => e.id === id.e2)).toBe(false);
  expect(after.edges.some((e) => e.id === id.e3)).toBe(false);
  expect(after.edges.some((e) => e.id === id.e4)).toBe(false);

  const openToGroup = after.edges.find((e) => e.id === id.e1);
  expect(openToGroup).toMatchObject({ source: id.open, target: id.group, originId: id.e1 });

  const noRecipient = after.edges.find((e) => e.id === id.e5);
  expect(noRecipient).toMatchObject({
    source: id.group,
    target: id.call,
    label: "no recipient",
    originId: id.e5,
  });

  const toFile = after.edges.find((e) => e.id === id.e6);
  expect(toFile).toMatchObject({ source: id.group, target: id.file, originId: id.e6 });

  const receiptPath = after.edges.find((e) => e.id === id.extra);
  expect(receiptPath).toMatchObject({
    source: id.group,
    target: id.receipt,
    originId: id.extra,
  });

  const receipt = after.nodes.find((n) => n.id === id.receipt);
  expect(receipt?.projectedKind).toBe("extra");
  expect(after.nodes.some((n) => n.id === id.open)).toBe(true);
  expect(after.nodes.some((n) => n.id === id.call)).toBe(true);

  expect(noRecipient?.label).not.toBe(toFile?.label);
  expect(after.internals[0]?.internalEdges.map((e) => e.id).sort()).toEqual(
    [id.e2, id.e3, id.e4].sort(),
  );
});
