import { describe, expect, test } from "vitest";
import { stringify } from "yaml";
import { freshBoard, OAK_PARK_IDS, oakParkInvoice } from "../demos/oakParkInvoice";
import { MAILROOM_IDS, robotMailroom } from "../demos/robotMailroom";
import oakParkYaml from "../demos/oak-park-invoice.yaml?raw";
import mailroomYaml from "../demos/robot-mailroom.yaml?raw";
import { parseDocument } from "./migrate";
import {
  ILLUSTRATOR_FILE_SOURCE,
  ILLUSTRATOR_FILE_TYPE,
  workflowExportFilename,
  workflowToIllustrator,
  workflowToYaml,
} from "./serialize";
import { validateWorkflow } from "./graph";
import { AssignmentLane, SplitKind, StepKind, WorkflowNodeKind } from "./catalogs";
import {
  emptyAfterOverlay,
  emptyWorkflow,
  isDataFieldNode,
  isStepNode,
  laneAssignments,
  laneBoard,
  type WorkflowDoc,
} from "./types";
import type { WorkflowDocV1 } from "./types";

const MINI_YAML = `version: 2
name: Mini
actors: []
nodes:
  - id: s_root
    type: step
    position:
      x: 0
      y: 0
    stepKind: other
    title: Task
    detail: ""
    split: exclusive
edges: []
assignments: {}
after:
  assignments: {}
  groups: []
  extraNodes: []
  extraEdges: []
`;

const V1: WorkflowDocV1 = {
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

function cycleYaml() {
  return `version: 2
actors: []
nodes:
  - id: a
    type: step
    position: { x: 0, y: 0 }
    stepKind: other
    title: A
    detail: ""
    split: exclusive
  - id: b
    type: step
    position: { x: 0, y: 40 }
    stepKind: other
    title: B
    detail: ""
    split: exclusive
edges:
  - id: e1
    source: a
    target: b
    label: ""
  - id: e2
    source: b
    target: a
    label: ""
assignments: {}
after:
  assignments: {}
  groups: []
  extraNodes: []
  extraEdges: []
`;
}

/**
 * Every stored field in play: Before Travel Step and Data color, an After copy that
 * dropped the last Review and added a Travel Step, a different After Data color,
 * and separate Before / After look books.
 */
function divergedOakPark(): WorkflowDoc {
  const doc = oakParkInvoice();
  const fs = doc.nodes.find((n) => n.id === OAK_PARK_IDS.fs);
  if (!fs || !isStepNode(fs)) throw new Error("missing s_fs");
  fs.stepKind = StepKind.Travel;
  const acct = doc.nodes.find((n) => n.id === OAK_PARK_IDS.acct);
  if (!acct || !isDataFieldNode(acct)) throw new Error("missing d_acct");
  acct.color = "#6b8cff";
  doc.looks = { [OAK_PARK_IDS.alice]: { accessories: ["sunglasses", "scanner"] } };

  const fork = structuredClone(laneBoard(doc, AssignmentLane.After));
  fork.nodes = fork.nodes.filter((n) => n.id !== OAK_PARK_IDS.review3);
  fork.edges = fork.edges.filter((e) => e.id !== OAK_PARK_IDS.reviewTo3);
  delete fork.assignments[OAK_PARK_IDS.review3];
  const forkAcct = fork.nodes.find((n) => n.id === OAK_PARK_IDS.acct);
  if (!forkAcct || !isDataFieldNode(forkAcct)) throw new Error("missing After d_acct");
  forkAcct.color = "#d65db1";
  fork.nodes.push({
    id: "s_courier",
    type: WorkflowNodeKind.Step,
    position: { x: 1824, y: 160 },
    stepKind: StepKind.Travel,
    title: "courier",
    detail: "drop at City Hall",
    split: SplitKind.Exclusive,
  });
  fork.edges.push({ id: "e_courier", source: OAK_PARK_IDS.review2, target: "s_courier", label: "" });
  fork.assignments.s_courier = OAK_PARK_IDS.robot;
  doc.after = {
    ...emptyAfterOverlay(),
    fork,
    looks: { [OAK_PARK_IDS.roy]: { accessories: ["tablet"] } },
  };
  return doc;
}

describe(".illustrator files", () => {
  test("header comes first, then the document, as pretty JSON", () => {
    const text = workflowToIllustrator(oakParkInvoice());
    expect(text.endsWith("}\n")).toBe(true);
    const file = JSON.parse(text) as Record<string, unknown>;
    expect(Object.keys(file).slice(0, 4)).toEqual(["type", "version", "source", "name"]);
    expect(file).toMatchObject({
      type: ILLUSTRATOR_FILE_TYPE,
      version: 2,
      source: ILLUSTRATOR_FILE_SOURCE,
      name: "Oak Park Invoice",
    });
    expect(text).toContain('\n  "type": "automation-illustrator",\n');
  });

  test("Export and re-Import keep the demos and an empty board, without the header", () => {
    for (const doc of [oakParkInvoice(), robotMailroom(), emptyWorkflow()]) {
      const parsed = parseDocument(workflowToIllustrator(doc));
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) continue;
      expect(parsed.doc).toEqual(doc);
      expect(parsed.doc).not.toHaveProperty("type");
      expect(parsed.doc).not.toHaveProperty("source");
    }
  });

  test("an After copy, both look books, Data colors, and Travel survive every file path", () => {
    const doc = divergedOakPark();
    expect(validateWorkflow(doc)).toEqual([]);
    const text = workflowToIllustrator(doc);
    for (const raw of [text, workflowToYaml(doc), JSON.stringify(doc, null, 2)]) {
      const parsed = parseDocument(raw);
      expect(parsed.ok).toBe(true);
      if (parsed.ok) expect(parsed.doc).toEqual(doc);
    }
    const parsed = parseDocument(text);
    if (!parsed.ok) throw new Error(parsed.message);
    expect(workflowToIllustrator(parsed.doc)).toBe(text);
    expect(laneBoard(parsed.doc, AssignmentLane.Before).nodes.map((n) => n.id)).toContain(
      OAK_PARK_IDS.review3,
    );
    expect(laneBoard(parsed.doc, AssignmentLane.After).nodes.map((n) => n.id)).not.toContain(
      OAK_PARK_IDS.review3,
    );
    expect(laneAssignments(parsed.doc, AssignmentLane.After).s_courier).toBe(OAK_PARK_IDS.robot);
    expect(parsed.doc.looks?.[OAK_PARK_IDS.alice]?.accessories).toEqual(["sunglasses", "scanner"]);
    expect(parsed.doc.after.looks).toEqual({ [OAK_PARK_IDS.roy]: { accessories: ["tablet"] } });
  });

  test("a board named and dressed mid-session writes the same bytes after a reload", () => {
    const board = freshBoard();
    const alice = board.actors.find((a) => a.name === "Alice");
    if (!alice) throw new Error("missing Alice");
    const named: WorkflowDoc = { ...board, name: "Late Name" };
    named.looks = { [alice.id]: { accessories: ["tablet"] } };
    expect(Object.keys(named).slice(-2)).toEqual(["name", "looks"]);
    const text = workflowToIllustrator(named);
    expect(Object.keys(JSON.parse(text))).toEqual([
      "type",
      "version",
      "source",
      "name",
      "actors",
      "nodes",
      "edges",
      "assignments",
      "looks",
      "after",
    ]);
    const reloaded = parseDocument(text);
    if (!reloaded.ok) throw new Error(reloaded.message);
    expect(workflowToIllustrator(reloaded.doc)).toBe(text);
    expect(workflowToYaml(reloaded.doc)).toBe(workflowToYaml(named));
  });

  test("a following After stays following and writes no After look book", () => {
    const doc = robotMailroom();
    doc.after = emptyAfterOverlay();
    const file = JSON.parse(workflowToIllustrator(doc)) as { after: Record<string, unknown> };
    expect(file.after.fork).toBeNull();
    expect(file.after).not.toHaveProperty("looks");
    const parsed = parseDocument(JSON.stringify(file));
    expect(parsed.ok && parsed.doc.after.fork).toBeNull();
    expect(parsed.ok && parsed.doc.after.looks).toBeNull();
  });

  test("an After look copy where nobody wears anything is kept as a copy", () => {
    const doc = oakParkInvoice();
    doc.looks = { [OAK_PARK_IDS.alice]: { accessories: ["tablet"] } };
    doc.after = { ...doc.after, looks: {} };
    const parsed = parseDocument(workflowToIllustrator(doc));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.doc.after.looks).toEqual({});
    expect(parsed.doc.looks?.[OAK_PARK_IDS.alice]?.accessories).toEqual(["tablet"]);
  });

  test("a file from before the After copy and look book upgrades, then exports clean", () => {
    const legacy = `version: 2
name: Legacy
actors:
  - id: h_ada
    kind: human
    name: Ada
    color: "#ff9fbf"
    role: worker
    accessories:
      - sunglasses
  - id: r_bot
    kind: robot
    name: Robot
    color: "#6ab0c8"
    robotKind: script
    role: Script
nodes:
  - id: s_root
    type: step
    position: { x: 0, y: 0 }
    stepKind: copy
    title: forms
    detail: ""
    split: exclusive
edges: []
assignments:
  s_root: h_ada
after:
  assignments:
    s_root: r_bot
  groups: []
  extraNodes: []
  extraEdges: []
`;
    const parsed = parseDocument(legacy);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.doc.actors[0]).not.toHaveProperty("accessories");
    expect(parsed.doc.looks).toEqual({ h_ada: { accessories: ["sunglasses"] } });
    expect(parsed.doc.after.looks).toBeNull();
    const root = parsed.doc.nodes[0];
    expect(root && isStepNode(root) && root.stepKind).toBe(StepKind.Travel);
    expect(laneAssignments(parsed.doc, AssignmentLane.Before).s_root).toBe("h_ada");
    expect(laneAssignments(parsed.doc, AssignmentLane.After).s_root).toBe("r_bot");
    expect(parsed.doc.after.fork).not.toBeNull();

    const text = workflowToIllustrator(parsed.doc);
    expect(text).not.toContain('"copy"');
    expect(JSON.parse(text).actors[0]).not.toHaveProperty("accessories");
    const again = parseDocument(text);
    expect(again.ok && again.doc).toEqual(parsed.doc);
  });

  test("a file whose type names another format is refused", () => {
    const excalidraw = JSON.stringify({
      type: "excalidraw",
      version: 2,
      source: "https://excalidraw.com",
      elements: [],
      appState: {},
      files: {},
    });
    const refused = parseDocument(excalidraw);
    expect(refused.ok).toBe(false);
    if (!refused.ok) {
      expect(refused.code).toBe("unsupported-version");
      expect(refused.message).toMatch(/not an Automation Illustrator workflow/);
    }
    const body = JSON.parse(workflowToIllustrator(oakParkInvoice())) as Record<string, unknown>;
    expect(parseDocument(JSON.stringify({ ...body, type: "something-else" })).ok).toBe(false);
    expect(parseDocument(JSON.stringify({ ...body, type: null })).ok).toBe(false);
  });

  test("the header is the only extra; source is optional and older headerless files still load", () => {
    const body = JSON.parse(workflowToIllustrator(oakParkInvoice())) as Record<string, unknown>;
    const { source: _source, ...noSource } = body;
    expect(parseDocument(JSON.stringify(noSource)).ok).toBe(true);
    const { type: _type, source: _s, ...headerless } = body;
    const parsed = parseDocument(JSON.stringify(headerless));
    expect(parsed.ok && parsed.doc).toEqual(oakParkInvoice());
  });
});

test("demo YAML fixtures parse to the same documents as the loaders", () => {
  const oak = parseDocument(oakParkYaml);
  const mail = parseDocument(mailroomYaml);
  expect(oak.ok).toBe(true);
  expect(mail.ok).toBe(true);
  if (oak.ok) expect(oak.doc).toEqual(oakParkInvoice());
  if (mail.ok) expect(mail.doc).toEqual(robotMailroom());
});

test("YAML round-trip keeps a validated v2 document", () => {
  for (const doc of [oakParkInvoice(), robotMailroom(), emptyWorkflow()]) {
    const yaml = workflowToYaml(doc);
    expect(yaml.startsWith("{")).toBe(false);
    const parsed = parseDocument(yaml);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.doc).toEqual(doc);
  }
});

test("JSON files still import (YAML 1.2 is a JSON superset)", () => {
  const json = JSON.stringify(oakParkInvoice(), null, 2);
  const parsed = parseDocument(json);
  expect(parsed.ok).toBe(true);
  if (parsed.ok) expect(parsed.doc).toEqual(oakParkInvoice());
});

test("YAML comments are ignored and hex colors stay strings", () => {
  const parsed = parseDocument(oakParkYaml);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) return;
  const alice = parsed.doc.actors.find((a) => a.id === "h_alice");
  expect(alice?.color).toBe("#ff9fbf");
  expect(parsed.doc.nodes.find((n) => n.id === "s_enter")).toMatchObject({
    title: "BS&A Software",
  });
});

test("Human accessories round-trip on the look book and an empty list is omitted", () => {
  const doc = oakParkInvoice();
  doc.looks = { h_alice: { accessories: ["sunglasses", "scanner"] } };
  const yaml = workflowToYaml(doc);
  expect(yaml).toMatch(/looks:\n {2}h_alice:\n {4}accessories:\n {6}- sunglasses\n {6}- scanner/);
  expect(yaml.split("\nnodes:")[0]).not.toMatch(/accessories/);
  const parsed = parseDocument(yaml);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) return;
  expect(parsed.doc.actors.find((a) => a.id === "h_alice")).not.toHaveProperty("accessories");
  expect(parsed.doc.looks?.h_alice?.accessories).toEqual(["sunglasses", "scanner"]);
  expect(parsed.doc.looks?.h_roy).toBeUndefined();
  expect(parsed.doc.after.looks ?? null).toBeNull();

  doc.after = { ...doc.after, looks: { h_alice: { accessories: ["tablet"] } } };
  const afterYaml = workflowToYaml(doc);
  expect(afterYaml).toMatch(/looks:\n {4}h_alice:\n {6}accessories:\n {8}- tablet/);
  const afterParsed = parseDocument(afterYaml);
  expect(afterParsed.ok).toBe(true);
  if (!afterParsed.ok) return;
  expect(afterParsed.doc.after.looks?.h_alice?.accessories).toEqual(["tablet"]);
  expect(afterParsed.doc.looks?.h_alice?.accessories).toEqual(["sunglasses", "scanner"]);
});

test("a Data color round-trips in YAML and is omitted when unset", () => {
  const doc = oakParkInvoice();
  const before = doc.nodes.find((n) => n.id === OAK_PARK_IDS.acct);
  expect(before && isDataFieldNode(before) ? before.color : "missing").toBeUndefined();
  const yamlBefore = workflowToYaml(doc);
  const beforeBlock = yamlBefore.split("id: d_acct")[1]?.split("\n  - id:")[0] ?? "";
  expect(beforeBlock).not.toMatch(/color:/);

  const field = doc.nodes.find((n) => n.id === OAK_PARK_IDS.acct);
  if (!field || !isDataFieldNode(field)) throw new Error("missing data");
  field.color = "#6b8cff";
  const yaml = workflowToYaml(doc);
  expect(yaml).toMatch(/color: ["']#6b8cff["']/);
  const parsed = parseDocument(yaml);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) return;
  const round = parsed.doc.nodes.find((n) => n.id === OAK_PARK_IDS.acct);
  expect(round && isDataFieldNode(round) ? round.color : undefined).toBe("#6b8cff");
});

test("exported YAML quotes hex colors and keeps actor edits", () => {
  const doc = oakParkInvoice();
  const alice = doc.actors.find((a) => a.id === "h_alice");
  if (alice && "role" in alice) {
    alice.name = "Alicia";
    alice.role = "";
  }
  const llm = doc.actors.find((a) => a.id === "r_llm");
  if (llm && "role" in llm) llm.role = "";
  const yaml = workflowToYaml(doc);
  expect(yaml).toMatch(/name: Alicia/);
  expect(yaml).toMatch(/role: worker/);
  expect(yaml).toMatch(/role: LLM/);
  expect(yaml).toMatch(/color: ["']#/);
  expect(yaml).not.toMatch(/color: #/);
  const parsed = parseDocument(yaml);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) return;
  const round = parsed.doc.actors.find((a) => a.id === "h_alice");
  expect(round).toMatchObject({ name: "Alicia", color: "#ff9fbf", role: "worker" });
  expect(parsed.doc.actors.find((a) => a.id === "r_llm")).toMatchObject({ role: "LLM" });
});

test("export filename slugs the project name", () => {
  expect(workflowExportFilename(oakParkInvoice())).toBe("oak-park-invoice.illustrator");
  expect(workflowExportFilename(robotMailroom())).toBe("robot-mailroom.illustrator");
  expect(workflowExportFilename(emptyWorkflow())).toBe("untitled.illustrator");
  expect(workflowExportFilename({ name: "  " })).toBe("untitled.illustrator");
});

test("invalid text is rejected before the document is touched", () => {
  const result = parseDocument("{");
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.code).toBe("invalid-json");
    expect(result.message).toMatch(/YAML or JSON/);
  }
});

describe("parse edge cases", () => {
  test("empty and whitespace-only files are rejected as empty", () => {
    for (const raw of ["", "   ", "\n\t\n", "---\n"]) {
      const result = parseDocument(raw);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toMatch(/empty/i);
    }
  });

  test("UTF-8 BOM, CRLF, and --- document start still import", () => {
    const body = MINI_YAML;
    const bom = parseDocument(`\uFEFF${body}`);
    const crlf = parseDocument(body.replace(/\n/g, "\r\n"));
    const dashed = parseDocument(`---\n${body}`);
    expect(bom.ok && bom.doc.name).toBe("Mini");
    expect(crlf.ok && crlf.doc.name).toBe("Mini");
    expect(dashed.ok && dashed.doc.name).toBe("Mini");
  });

  test("compact JSON and JSON with a trailing comma still import via YAML 1.2", () => {
    const compact = parseDocument(JSON.stringify(oakParkInvoice()));
    expect(compact.ok).toBe(true);
    const trailing = parseDocument('{"version":2,"actors":[],"nodes":[],"edges":[],"assignments":{},"after":{"assignments":{},"groups":[],"extraNodes":[],"extraEdges":[]},}');
    expect(trailing.ok).toBe(true);
    if (trailing.ok) expect(trailing.doc.nodes).toEqual([]);
  });

  test("tab indentation, duplicate keys, and multiple documents are rejected", () => {
    expect(parseDocument("version: 2\n\tnodes: []\n").ok).toBe(false);
    expect(parseDocument("version: 2\nversion: 2\n").ok).toBe(false);
    const multi = parseDocument("---\nversion: 2\n---\nversion: 1\n");
    expect(multi.ok).toBe(false);
  });

  test("quoted version 2 is not coerced; unquoted 2.0 is", () => {
    const quoted = parseDocument(MINI_YAML.replace("version: 2", 'version: "2"'));
    expect(quoted.ok).toBe(false);
    if (!quoted.ok) expect(quoted.code).toBe("unsupported-version");
    const dotted = parseDocument(MINI_YAML.replace("version: 2", "version: 2.0"));
    expect(dotted.ok).toBe(true);
  });

  test("YAML 1.2 keeps on/yes/NO as strings so dashed: yes is invalid shape", () => {
    const yes = parseDocument(MINI_YAML.replace("edges: []", `edges:
  - id: e1
    source: s_root
    target: s_root
    label: ""
    dashed: yes`));
    expect(yes.ok).toBe(false);
    const norway = parseDocument(MINI_YAML.replace('title: Task', "title: NO"));
    expect(norway.ok).toBe(true);
    if (norway.ok) {
      const root = norway.doc.nodes[0];
      expect(root && "title" in root && root.title).toBe("NO");
    }
  });

  test("v1 YAML migrates; a cyclic v2 YAML is rejected", () => {
    const ok = parseDocument(stringify(V1));
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.migratedFrom).toBe(1);
      expect(ok.doc.version).toBe(2);
      expect(ok.doc.assignments.s_read).toBe("h_alice");
      expect(laneAssignments(ok.doc, AssignmentLane.After).s_read).toBe("r_script");
    }
    const v2cycle = parseDocument(cycleYaml());
    expect(v2cycle.ok).toBe(false);
    if (!v2cycle.ok) expect(v2cycle.code).toBe("invalid-graph");
  });

  test("unknown extra fields are stripped; derived layout is not in Export", () => {
    const parsed = parseDocument(`${MINI_YAML}viewport:\n  x: 1\n`);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.doc).not.toHaveProperty("viewport");
    const yaml = workflowToYaml(oakParkInvoice());
    expect(yaml).not.toMatch(/laneViewport|elk|layout|history/);
  });

  test("NaN/Inf positions and a numeric Path condition are rejected", () => {
    const inf = parseDocument(MINI_YAML.replace("x: 0", "x: .inf"));
    expect(inf.ok).toBe(false);
    const numbered = parseDocument(MINI_YAML.replace("edges: []", `edges:
  - id: e1
    source: s_root
    target: s_root
    label: 50`));
    expect(numbered.ok).toBe(false);
  });

  test("scientific-notation coordinates import as finite numbers", () => {
    const parsed = parseDocument(MINI_YAML.replace("x: 0", "x: 1e2"));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.doc.nodes[0]?.position.x).toBe(100);
  });

  test("multiline conditions and unicode names round-trip", () => {
    const doc = oakParkInvoice();
    const edge = doc.edges.find((e) => e.id === "e_gt");
    if (edge) edge.label = "invoice > $50,000\nand rush";
    doc.name = "Café Invoice 发票";
    const yaml = workflowToYaml(doc);
    const parsed = parseDocument(yaml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.doc.name).toBe("Café Invoice 发票");
    expect(parsed.doc.edges.find((e) => e.id === "e_gt")?.label).toContain("and rush");
  });

  test("merge groups unfold on YAML parse; After-only extras stay empty", () => {
    const mail = robotMailroom();
    const grouped: WorkflowDoc = {
      ...mail,
      after: {
        ...mail.after,
        groups: [{ id: MAILROOM_IDS.group, memberIds: [MAILROOM_IDS.scan, MAILROOM_IDS.lookup, MAILROOM_IDS.route] }],
      },
    };
    const yaml = workflowToYaml(grouped);
    const parsed = parseDocument(yaml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.unfolded).toBe(true);
    expect(parsed.doc.after.groups).toEqual([]);
    expect(parsed.droppedAfterOnly).toBe(false);
    expect(parsed.doc.after.extraNodes).toEqual([]);
    expect(parsed.doc.after.extraEdges).toEqual([]);
  });

  test("omitted Path dashed is valid on a 1:1 Path", () => {
    const two = parseDocument(`version: 2
actors: []
nodes:
  - id: a
    type: step
    position: { x: 0, y: 0 }
    stepKind: other
    title: A
    detail: ""
    split: exclusive
  - id: b
    type: step
    position: { x: 40, y: 0 }
    stepKind: other
    title: B
    detail: ""
    split: exclusive
edges:
  - id: e1
    source: a
    target: b
    label: ""
assignments: {}
after:
  assignments: {}
  groups: []
  extraNodes: []
  extraEdges: []
`);
    expect(two.ok).toBe(true);
    if (two.ok) expect(two.doc.edges[0]?.dashed).toBeUndefined();
  });

  test("demo loaders clone so a caller cannot mutate the fixture", () => {
    const a = oakParkInvoice();
    const root = a.nodes.find((n) => n.id === "s_read");
    if (root && "title" in root) root.title = "hacked";
    expect(oakParkInvoice().nodes.find((n) => n.id === "s_read")).toMatchObject({
      title: "invoice.pdf",
    });
  });

  test("parseDocument never throws on junk", () => {
    for (const raw of ["*", "&a [*a]", "\0", "[[[", "version:", "😀", "null", "~", "[]", "true"]) {
      expect(() => parseDocument(raw)).not.toThrow();
      expect(parseDocument(raw).ok).toBe(false);
    }
  });

  test("YAML 1.2 merge key is a literal field and is stripped", () => {
    const parsed = parseDocument(`${MINI_YAML}<<: { name: hijack }\n`);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.doc.name).toBe("Mini");
  });
});

describe("export filenames", () => {
  test("path pieces, unicode, emoji, and punctuation do not escape the download name", () => {
    expect(workflowExportFilename({ name: "../etc/passwd" })).toBe("etc-passwd.illustrator");
    expect(workflowExportFilename({ name: "foo/bar\\baz" })).toBe("foo-bar-baz.illustrator");
    expect(workflowExportFilename({ name: "Café Board" })).toBe("cafe-board.illustrator");
    expect(workflowExportFilename({ name: "🎉" })).toBe("untitled.illustrator");
    expect(workflowExportFilename({ name: "!!!" })).toBe("untitled.illustrator");
    expect(workflowExportFilename({ name: "My Board (v2)" })).toBe("my-board-v2.illustrator");
    expect(workflowExportFilename({ name: "C:\\Users\\board" })).toBe("c-users-board.illustrator");
  });

  test("very long titles are clipped to a bounded slug", () => {
    const name = `Board ${"x".repeat(200)}`;
    const file = workflowExportFilename({ name });
    expect(file.endsWith(".illustrator")).toBe(true);
    expect(file.length).toBeLessThanOrEqual(80 + ".illustrator".length);
    expect(file).not.toContain("/");
  });
});

