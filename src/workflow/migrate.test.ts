import { expect, test } from "vitest";
import { parseDocument, migrateV1ToV2 } from "./migrate";
import type { WorkflowDocV1 } from "./types";

const v1Oak: WorkflowDocV1 = {
  version: 1,
  actors: [
    { id: "h_alice", kind: "human", name: "Alice", color: "#f4c6d4" },
    { id: "r_script", kind: "robot", name: "Robot", color: "#8aa8b8", robotKind: "script" },
  ],
  nodes: [
    {
      id: "s_read",
      type: "step",
      position: { x: 32, y: 160 },
      stepKind: "read",
      title: "invoice.pdf",
      detail: "",
      split: "exclusive",
      stub: true,
    },
    {
      id: "d_acct",
      type: "dataField",
      position: { x: 672, y: 192 },
      label: "Account #",
    },
  ],
  edges: [{ id: "e_acct", source: "s_read", target: "d_acct", label: "" }],
  assignments: {
    before: { s_read: "h_alice" },
    after: { s_read: "r_script" },
  },
};

test("v1 lane maps become base assignments plus after.assignments", () => {
  const v2 = migrateV1ToV2(v1Oak);
  expect(v2.version).toBe(2);
  expect(v2.assignments).toEqual({ s_read: "h_alice" });
  expect(v2.after.assignments).toEqual({ s_read: "r_script" });
  expect(v2.after.groups).toEqual([]);
  expect(v2.after.extraNodes).toEqual([]);
  expect(v2.after.extraEdges).toEqual([]);
});

test("migration drops stub and fills missing Human role with worker", () => {
  const v2 = migrateV1ToV2(v1Oak);
  const read = v2.nodes.find((n) => n.id === "s_read");
  expect(read && "stub" in read ? (read as { stub?: boolean }).stub : undefined).toBeUndefined();
  expect(JSON.stringify(read)).not.toContain("stub");
  const alice = v2.actors.find((a) => a.id === "h_alice");
  expect(alice && "role" in alice ? alice.role : undefined).toBe("worker");
});

test("parseDocument migrates valid v1 and rejects an invalid v1 graph without migrating", () => {
  const ok = parseDocument(JSON.stringify(v1Oak));
  expect(ok.ok).toBe(true);
  if (ok.ok) {
    expect(ok.migratedFrom).toBe(1);
    expect(ok.doc.version).toBe(2);
    expect(ok.doc.assignments.s_read).toBe("h_alice");
    expect(ok.doc.after.assignments.s_read).toBe("r_script");
  }

  const cyclicV1 = {
    version: 1,
    actors: [],
    nodes: [
      {
        id: "a",
        type: "step",
        position: { x: 0, y: 0 },
        stepKind: "other",
        title: "",
        detail: "",
        split: "exclusive",
      },
      {
        id: "b",
        type: "step",
        position: { x: 0, y: 40 },
        stepKind: "other",
        title: "",
        detail: "",
        split: "exclusive",
      },
    ],
    edges: [
      { id: "e1", source: "a", target: "b", label: "" },
      { id: "e2", source: "b", target: "a", label: "" },
    ],
    assignments: { before: {}, after: {} },
  };
  const bad = parseDocument(JSON.stringify(cyclicV1));
  expect(bad.ok).toBe(false);
  if (!bad.ok) {
    expect(bad.code).toBe("invalid-graph");
    expect(bad.violations.map((v) => v.code)).toEqual(expect.arrayContaining(["cycle", "no-root"]));
  }
});
