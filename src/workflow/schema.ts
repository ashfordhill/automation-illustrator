/**
 * Zod 4 schemas for workflow documents.
 * Shape schemas plus graph-invariant refinements that emit GraphViolation messages (SH-09).
 */
import { z } from "zod";
import {
  ActorKind,
  RobotKind,
  SplitKind,
  WorkflowNodeKind,
  WORKFLOW_VERSION,
  WORKFLOW_VERSION_V1,
} from "./catalogs";
import { validateWorkflow, validateWorkflowV1, type GraphViolation } from "./graph";
import { DEFAULT_HUMAN_ROLE, STEP_KINDS, type WorkflowDoc, type WorkflowDocV1 } from "./types";

const idSchema = z.string().min(1);
const colorSchema = z.string().min(1);
const pointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

const robotKindSchema = z.enum([RobotKind.Llm, RobotKind.Agent, RobotKind.Script]);
const splitSchema = z.enum([SplitKind.Exclusive, SplitKind.Parallel]);
const stepKindSchema = z.enum(STEP_KINDS);

const humanShape = {
  id: idSchema,
  kind: z.literal(ActorKind.Human),
  name: z.string(),
  color: colorSchema,
};

const humanV1Schema = z.object({
  ...humanShape,
  role: z.string().optional(),
});

const humanV2Schema = z.object({
  ...humanShape,
  role: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? DEFAULT_HUMAN_ROLE : value),
    z.string().min(1),
  ),
});

const robotSchema = z.object({
  id: idSchema,
  kind: z.literal(ActorKind.Robot),
  name: z.string(),
  color: colorSchema,
  robotKind: robotKindSchema,
});

const actorV1Schema = z.discriminatedUnion("kind", [humanV1Schema, robotSchema]);
const actorV2Schema = z.discriminatedUnion("kind", [humanV2Schema, robotSchema]);

const stepFields = {
  id: idSchema,
  type: z.literal(WorkflowNodeKind.Step),
  position: pointSchema,
  stepKind: stepKindSchema,
  title: z.string(),
  detail: z.string(),
  split: splitSchema,
};

const stepV1Schema = z.object({
  ...stepFields,
  stub: z.boolean().optional(),
});

const stepV2Schema = z.object(stepFields);

const dataFieldSchema = z.object({
  id: idSchema,
  type: z.literal(WorkflowNodeKind.DataField),
  position: pointSchema,
  label: z.string(),
});

const nodeV1Schema = z.discriminatedUnion("type", [stepV1Schema, dataFieldSchema]);
const nodeV2Schema = z.discriminatedUnion("type", [stepV2Schema, dataFieldSchema]);

const edgeSchema = z.object({
  id: idSchema,
  source: idSchema,
  target: idSchema,
  label: z.string(),
  dashed: z.boolean().optional(),
});

const assignmentsMapSchema = z.record(z.string(), z.string());

const mergeGroupSchema = z.object({
  id: idSchema,
  memberIds: z.array(idSchema),
});

const afterOverlaySchema = z.object({
  assignments: assignmentsMapSchema,
  groups: z.array(mergeGroupSchema),
  extraNodes: z.array(stepV2Schema),
  extraEdges: z.array(edgeSchema),
});

function issuesFromViolations(
  violations: GraphViolation[],
  ctx: { addIssue: (arg: { code: "custom"; message: string; continue: boolean }) => void },
) {
  for (const item of violations) {
    ctx.addIssue({ code: "custom", message: item.message, continue: true });
  }
}

/** v1 shape (optional Human role, optional Step stub, dual assignment lanes). */
export const workflowDocV1Shape = z.object({
  version: z.literal(WORKFLOW_VERSION_V1),
  actors: z.array(actorV1Schema),
  nodes: z.array(nodeV1Schema),
  edges: z.array(edgeSchema),
  assignments: z.object({
    before: assignmentsMapSchema,
    after: assignmentsMapSchema,
  }),
});

/** v2 shape (BA-01 overlay; no stub). Optional name is the status-bar project title. */
export const workflowDocV2Shape = z.object({
  version: z.literal(WORKFLOW_VERSION),
  name: z.string().optional(),
  actors: z.array(actorV2Schema),
  nodes: z.array(nodeV2Schema),
  edges: z.array(edgeSchema),
  assignments: assignmentsMapSchema,
  after: afterOverlaySchema,
});

/** v1 schema with WG-02..WG-04 refinements. Invalid graphs fail closed (SH-09). */
export const workflowDocV1Schema = workflowDocV1Shape.superRefine((doc, ctx) => {
  issuesFromViolations(validateWorkflowV1(doc as WorkflowDocV1), ctx);
});

/** v2 schema with identity, reference, overlay, and graph-invariant refinements. */
export const workflowDocV2Schema = workflowDocV2Shape.superRefine((doc, ctx) => {
  issuesFromViolations(validateWorkflow(doc as WorkflowDoc), ctx);
});

/** Map a Zod shape failure onto the SH-09 violation list. */
export function shapeViolations(error: z.ZodError): GraphViolation[] {
  return error.issues.map((issue) => ({
    code: "invalid-shape" as const,
    message: issue.path.length
      ? `${issue.path.join(".")}: ${issue.message}`
      : issue.message,
  }));
}
