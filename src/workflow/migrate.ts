/**
 * Parse YAML or JSON into a validated v2 document.
 * v1 migrates deterministically; invalid graphs are rejected, not repaired (SH-09).
 */
import { ActorKind, WorkflowNodeKind, WORKFLOW_VERSION } from "./catalogs";
import { parseWorkflowText } from "./serialize";
import { validateWorkflow, validateWorkflowV1, type GraphViolation } from "./graph";
import { shapeViolations, workflowDocV1Shape, workflowDocV2Shape } from "./schema";
import {
  DEFAULT_HUMAN_ROLE,
  emptyAfterOverlay,
  ROBOT_KIND_LABEL,
  unfoldMergeGroups,
  type ActorDto,
  type HumanDto,
  type NodeDto,
  type RobotDto,
  type StepNodeDto,
  type WorkflowDoc,
  type WorkflowDocV1,
} from "./types";

export type ParseSuccess = {
  ok: true;
  doc: WorkflowDoc;
  migratedFrom?: 1;
  unfolded?: boolean;
};

export type ParseFailure = {
  ok: false;
  code: "invalid-json" | "invalid-shape" | "invalid-graph" | "unsupported-version";
  message: string;
  violations: GraphViolation[];
};

export type ParseResult = ParseSuccess | ParseFailure;

function fail(
  code: ParseFailure["code"],
  message: string,
  violations: GraphViolation[],
): ParseFailure {
  return { ok: false, code, message, violations };
}

function summarize(violations: GraphViolation[]): string {
  if (!violations.length) return "This workflow is not valid.";
  if (violations.length === 1) return violations[0]!.message;
  return violations.map((item, i) => `${i + 1}. ${item.message}`).join(" ");
}

function withActorRole(actor: WorkflowDocV1["actors"][number]): ActorDto {
  if (actor.kind === ActorKind.Robot) {
    const role =
      typeof actor.role === "string" && actor.role.trim()
        ? actor.role.trim()
        : ROBOT_KIND_LABEL[actor.robotKind];
    const robot: RobotDto = {
      id: actor.id,
      kind: ActorKind.Robot,
      name: actor.name,
      color: actor.color,
      robotKind: actor.robotKind,
      role,
    };
    return robot;
  }
  const role =
    typeof actor.role === "string" && actor.role.trim()
      ? actor.role.trim()
      : DEFAULT_HUMAN_ROLE;
  const human: HumanDto = {
    id: actor.id,
    kind: ActorKind.Human,
    name: actor.name,
    color: actor.color,
    role,
  };
  return human;
}

function stripStub(node: WorkflowDocV1["nodes"][number]): NodeDto {
  if (node.type !== WorkflowNodeKind.Step) return node;
  const { stub: _stub, ...rest } = node as StepNodeDto & { stub?: boolean };
  return rest;
}

/** Lane mapping, drop stub, default Human role. Overlay starts empty (BA-01). */
export function migrateV1ToV2(doc: WorkflowDocV1): WorkflowDoc {
  return {
    version: WORKFLOW_VERSION,
    actors: doc.actors.map(withActorRole),
    nodes: doc.nodes.map(stripStub),
    edges: doc.edges,
    assignments: { ...doc.assignments.before },
    after: {
      ...emptyAfterOverlay(),
      assignments: { ...doc.assignments.after },
    },
  };
}

function parseUnknown(data: unknown): ParseResult {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return fail("invalid-shape", "Saved data is not a workflow object.", [
      { code: "invalid-shape", message: "Saved data is not a workflow object." },
    ]);
  }
  const version = (data as { version?: unknown }).version;
  if (version === 1) {
    const shape = workflowDocV1Shape.safeParse(data);
    if (!shape.success) {
      const violations = shapeViolations(shape.error);
      return fail("invalid-shape", summarize(violations), violations);
    }
    const v1 = shape.data as WorkflowDocV1;
    const graph = validateWorkflowV1(v1);
    if (graph.length) {
      return fail("invalid-graph", summarize(graph), graph);
    }
    const migrated = unfoldMergeGroups(migrateV1ToV2(v1));
    const again = validateWorkflow(migrated.doc);
    if (again.length) {
      return fail("invalid-graph", summarize(again), again);
    }
    return { ok: true, doc: migrated.doc, migratedFrom: 1, unfolded: migrated.unfolded };
  }
  if (version === 2) {
    const shape = workflowDocV2Shape.safeParse(data);
    if (!shape.success) {
      const violations = shapeViolations(shape.error);
      return fail("invalid-shape", summarize(violations), violations);
    }
    const doc = shape.data as WorkflowDoc;
    const graph = validateWorkflow(doc);
    if (graph.length) {
      return fail("invalid-graph", summarize(graph), graph);
    }
    const unfolded = unfoldMergeGroups(doc);
    return { ok: true, doc: unfolded.doc, unfolded: unfolded.unfolded };
  }
  return fail(
    "unsupported-version",
    "This file is not an Automation Pitch workflow.",
    [{ code: "invalid-shape", message: "This file is not an Automation Pitch workflow." }],
  );
}

function emptyFile(): ParseFailure {
  return fail("invalid-json", "This file is empty.", [
    { code: "invalid-shape", message: "This file is empty." },
  ]);
}

/** YAML (or JSON) parse, then validate/migrate. Never throws; never mutates the caller. */
export function parseDocument(raw: string): ParseResult {
  if (raw.trim() === "") return emptyFile();
  let data: unknown;
  try {
    data = parseWorkflowText(raw);
  } catch {
    return fail("invalid-json", "This file is not valid YAML or JSON.", [
      { code: "invalid-shape", message: "This file is not valid YAML or JSON." },
    ]);
  }
  if (data == null) return emptyFile();
  return parseUnknown(data);
}
