import { expect, test } from "vitest";
import { projectAfter, projectBefore } from "./projection";
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
});

test("Oak Park After projection matches Before when the overlay has no extras", () => {
  const doc = oakParkInvoice();
  const after = projectAfter(doc);
  expect(after.nodes.map((n) => n.id).sort()).toEqual(doc.nodes.map((n) => n.id).sort());
  expect(after.edges.map((e) => e.id).sort()).toEqual(doc.edges.map((e) => e.id).sort());
});

test("projectAfter shows every Before-origin Step plus After-only extras", () => {
  const doc = robotMailroom();
  const id = MAILROOM_IDS;
  const after = projectAfter(doc);
  expect(after.nodes.some((n) => n.id === id.scan)).toBe(true);
  expect(after.nodes.some((n) => n.id === id.lookup)).toBe(true);
  expect(after.nodes.some((n) => n.id === id.route)).toBe(true);
  expect(after.nodes.some((n) => n.id === id.recipient)).toBe(true);
  expect(after.nodes.some((n) => n.id === id.group)).toBe(false);
  expect(after.nodes.find((n) => n.id === id.scan)?.projectedKind).toBe("base");

  const receipt = after.nodes.find((n) => n.id === id.receipt);
  expect(receipt?.projectedKind).toBe("extra");
  const receiptPath = after.edges.find((e) => e.id === id.extra);
  expect(receiptPath).toMatchObject({
    source: id.route,
    target: id.receipt,
    originId: id.extra,
  });
  expect(after.edges.find((e) => e.id === id.e1)).toMatchObject({
    source: id.open,
    target: id.scan,
  });
});
