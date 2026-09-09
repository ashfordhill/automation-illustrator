import { expect, test } from "vitest";
import { oakParkInvoice } from "../demos/oakParkInvoice";
import { robotMailroom } from "../demos/robotMailroom";
import { ActorKind, SplitKind, StepKind, WorkflowNodeKind } from "./catalogs";
import { validateWorkflow, type GraphViolationCode } from "./graph";
import { parseDocument } from "./migrate";
import { workflowDocV2Schema } from "./schema";
import { emptyAfterOverlay, emptyWorkflow, type WorkflowDoc } from "./types";

function step(id: string, y = 0) {
  return {
    id,
    type: WorkflowNodeKind.Step,
    position: { x: 0, y },
    stepKind: StepKind.Other,
    title: id,
    detail: "",
    split: SplitKind.Exclusive,
  };
}

function path(id: string, source: string, target: string) {
  return { id, source, target, label: "" };
}

function actor(id: string) {
  return {
    id,
    kind: ActorKind.Human,
    name: "Ada",
    color: "#f4c6d4",
    role: "worker",
  };
}

function doc(partial: Partial<WorkflowDoc> & Pick<WorkflowDoc, "nodes" | "edges">): WorkflowDoc {
  return {
    version: 2,
    actors: partial.actors ?? [],
    nodes: partial.nodes,
    edges: partial.edges,
    assignments: partial.assignments ?? {},
    after: partial.after ?? emptyAfterOverlay(),
  };
}

function parseCodes(raw: unknown) {
  const result = parseDocument(JSON.stringify(raw));
  if (result.ok) return { ok: true as const, codes: [] as GraphViolationCode[], doc: result.doc };
  return { ok: false as const, codes: result.violations.map((v) => v.code), message: result.message, result };
}

test("empty board and both demos are valid v2 documents", () => {
  expect(validateWorkflow(emptyWorkflow())).toEqual([]);
  expect(validateWorkflow(oakParkInvoice())).toEqual([]);
  expect(validateWorkflow(robotMailroom())).toEqual([]);
  expect(parseDocument(JSON.stringify(oakParkInvoice())).ok).toBe(true);
  expect(parseDocument(JSON.stringify(robotMailroom())).ok).toBe(true);
});

test("v2 documents may omit name; demos keep their titles", () => {
  const parsedEmpty = parseDocument(JSON.stringify(emptyWorkflow()));
  expect(parsedEmpty.ok).toBe(true);
  if (parsedEmpty.ok) expect(parsedEmpty.doc.name).toBeUndefined();
  const oak = parseDocument(JSON.stringify(oakParkInvoice()));
  expect(oak.ok).toBe(true);
  if (oak.ok) expect(oak.doc.name).toBe("Oak Park Invoice");
  const mail = parseDocument(JSON.stringify(robotMailroom()));
  expect(mail.ok).toBe(true);
  if (mail.ok) expect(mail.doc.name).toBe("Robot Mailroom");
});

test("empty Human role becomes worker", () => {
  const parsed = parseCodes({
    version: 2,
    actors: [{ id: "h1", kind: "human", name: "Ada", color: "#f4c6d4", role: "" }],
    nodes: [step("a")],
    edges: [],
    assignments: {},
    after: emptyAfterOverlay(),
  });
  expect(parsed.ok).toBe(true);
  if (parsed.ok) {
    const ada = parsed.doc.actors[0];
    expect(ada && "role" in ada && ada.role).toBe("worker");
  }
});

test("invalid shape: missing fields, bad enums, empty color, non-object", () => {
  const invalidJson = parseDocument("{");
  expect(invalidJson.ok).toBe(false);
  if (!invalidJson.ok) expect(invalidJson.code).toBe("invalid-json");
  expect(parseCodes({ version: 2 }).codes).toContain("invalid-shape");
  expect(parseCodes("nope").ok).toBe(false);
  const badKind = doc({
    nodes: [{ ...step("a"), stepKind: "nope" as never }],
    edges: [],
  });
  expect(parseCodes(badKind).codes).toContain("invalid-shape");
  const badColor = {
    version: 2,
    actors: [{ id: "h1", kind: "human", name: "Ada", color: "", role: "worker" }],
    nodes: [step("a")],
    edges: [],
    assignments: {},
    after: emptyAfterOverlay(),
  };
  expect(parseCodes(badColor).codes).toContain("invalid-shape");
  const unsupported = parseDocument(JSON.stringify({ version: 99 }));
  expect(unsupported.ok).toBe(false);
  if (!unsupported.ok) expect(unsupported.code).toBe("unsupported-version");
});

test("duplicate IDs are rejected", () => {
  const result = parseCodes(
    doc({
      nodes: [step("a"), step("a")],
      edges: [],
    }),
  );
  expect(result.codes).toContain("duplicate-id");
});

test("missing Path references are rejected", () => {
  const result = parseCodes(
    doc({
      nodes: [step("a")],
      edges: [path("e1", "a", "missing")],
    }),
  );
  expect(result.codes).toContain("missing-ref");
});

test("invalid assignments and merge group members are rejected", () => {
  const data = {
    id: "d1",
    type: WorkflowNodeKind.DataField,
    position: { x: 0, y: 0 },
    label: "Amount",
  };
  const assign = parseCodes(
    doc({
      actors: [actor("h1")],
      nodes: [step("a"), data],
      edges: [path("e1", "a", "d1")],
      assignments: { d1: "h1" },
    }),
  );
  expect(assign.codes).toContain("invalid-assignment");

  const missingActor = parseCodes(
    doc({
      nodes: [step("a")],
      edges: [],
      assignments: { a: "h_missing" },
    }),
  );
  expect(missingActor.codes).toContain("invalid-assignment");

  const group = parseCodes(
    doc({
      nodes: [step("a"), data],
      edges: [path("e1", "a", "d1")],
      after: {
        ...emptyAfterOverlay(),
        groups: [{ id: "g1", memberIds: ["d1"] }],
      },
    }),
  );
  expect(group.codes).toContain("invalid-group");
});

test("each graph violation kind: disconnected, no-root, cycle, duplicate-path", () => {
  expect(
    parseCodes(doc({ nodes: [step("a"), step("b")], edges: [] })).codes,
  ).toEqual(["disconnected"]);

  const noRoot = parseCodes(
    doc({
      nodes: [step("a"), step("b")],
      edges: [path("e1", "a", "b"), path("e2", "b", "a")],
    }),
  );
  expect(noRoot.codes).toContain("no-root");
  expect(noRoot.codes).toContain("cycle");

  const unreachable = parseCodes(
    doc({
      nodes: [step("a"), step("b"), step("c")],
      edges: [path("e1", "a", "b"), path("e2", "c", "c")],
    }),
  );
  expect(unreachable.codes).toContain("disconnected");
  expect(unreachable.codes).toContain("cycle");

  expect(
    parseCodes(
      doc({
        nodes: [step("a"), step("b")],
        edges: [path("e1", "a", "b"), path("e2", "a", "b")],
      }),
    ).codes,
  ).toContain("duplicate-path");
});

test("fan-in from two sources into one sink is a valid connected DAG", () => {
  const fan = doc({
    nodes: [step("a"), step("b", 40), step("sink", 20)],
    edges: [path("e1", "a", "sink"), path("e2", "b", "sink")],
  });
  expect(validateWorkflow(fan)).toEqual([]);
  expect(workflowDocV2Schema.safeParse(fan).success).toBe(true);
});

test("reconvergence is valid; v2 schema refinements reject a cycle", () => {
  const reconverge = doc({
    nodes: [step("a"), step("b", 10), step("c", 40), step("d", 20)],
    edges: [
      path("e1", "a", "b"),
      path("e2", "a", "c"),
      path("e3", "b", "d"),
      path("e4", "c", "d"),
    ],
  });
  expect(validateWorkflow(reconverge)).toEqual([]);
  expect(workflowDocV2Schema.safeParse(reconverge).success).toBe(true);

  const cyclic = doc({
    nodes: [step("a"), step("b")],
    edges: [path("e1", "a", "b"), path("e2", "b", "a")],
  });
  expect(workflowDocV2Schema.safeParse(cyclic).success).toBe(false);
});
