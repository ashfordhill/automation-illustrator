import { describe, expect, test } from "vitest";
import { stringify } from "yaml";
import { oakParkInvoice } from "../demos/oakParkInvoice";
import { MAILROOM_IDS, robotMailroom } from "../demos/robotMailroom";
import oakParkYaml from "../demos/oak-park-invoice.yaml?raw";
import mailroomYaml from "../demos/robot-mailroom.yaml?raw";
import { parseDocument } from "./migrate";
import { workflowExportFilename, workflowToYaml } from "./serialize";
import { emptyWorkflow, type WorkflowDoc } from "./types";
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
  expect(workflowExportFilename(oakParkInvoice())).toBe("oak-park-invoice.yaml");
  expect(workflowExportFilename(robotMailroom())).toBe("robot-mailroom.yaml");
  expect(workflowExportFilename(emptyWorkflow())).toBe("untitled.yaml");
  expect(workflowExportFilename({ name: "  " })).toBe("untitled.yaml");
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
      expect(ok.doc.after.assignments.s_read).toBe("r_script");
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
    expect(workflowExportFilename({ name: "../etc/passwd" })).toBe("etc-passwd.yaml");
    expect(workflowExportFilename({ name: "foo/bar\\baz" })).toBe("foo-bar-baz.yaml");
    expect(workflowExportFilename({ name: "Café Board" })).toBe("cafe-board.yaml");
    expect(workflowExportFilename({ name: "🎉" })).toBe("untitled.yaml");
    expect(workflowExportFilename({ name: "!!!" })).toBe("untitled.yaml");
    expect(workflowExportFilename({ name: "My Board (v2)" })).toBe("my-board-v2.yaml");
    expect(workflowExportFilename({ name: "C:\\Users\\board" })).toBe("c-users-board.yaml");
  });

  test("very long titles are clipped to a bounded slug", () => {
    const name = `Board ${"x".repeat(200)}`;
    const file = workflowExportFilename({ name });
    expect(file.endsWith(".yaml")).toBe(true);
    expect(file.length).toBeLessThanOrEqual(80 + ".yaml".length);
    expect(file).not.toContain("/");
  });
});

