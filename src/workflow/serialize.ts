/**
 * YAML interchange for a WorkflowDoc (Export, Import, demo fixtures).
 * YAML 1.2 is a JSON superset, so Import also accepts JSON files.
 * Browser localStorage stays pretty JSON (see persistence.ts).
 */
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { packLook } from "./looks";
import {
  DEFAULT_HUMAN_ROLE,
  isHuman,
  isRobot,
  projectDisplayName,
  robotRole,
  type ActorLooks,
  type WorkflowDoc,
} from "./types";

const YAML_STRINGIFY = { indent: 2, lineWidth: 0 } as const;
const MAX_EXPORT_SLUG = 80;

/** Omit actors who wear nothing so a following board does not grow an empty map. */
function looksForFile(looks: ActorLooks | null | undefined): ActorLooks | undefined {
  if (!looks) return undefined;
  const out: ActorLooks = {};
  for (const [id, look] of Object.entries(looks)) {
    const packed = packLook(look);
    if (packed) out[id] = packed;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Fill blanks so a dropped demo YAML still parses (empty Human role is worker). */
function normalizeForFile(doc: WorkflowDoc): WorkflowDoc {
  const looks = looksForFile(doc.looks);
  const after = { ...doc.after };
  if (after.looks == null) delete after.looks;
  else after.looks = looksForFile(after.looks) ?? {};
  const next: WorkflowDoc = {
    ...doc,
    actors: doc.actors.map((actor) => {
      if (isHuman(actor)) {
        const role = actor.role.trim() || DEFAULT_HUMAN_ROLE;
        const { accessories: _omit, ...rest } = actor as typeof actor & { accessories?: unknown };
        return { ...rest, role };
      }
      if (isRobot(actor)) return { ...actor, role: robotRole(actor) };
      return actor;
    }),
    after,
  };
  if (looks) next.looks = looks;
  else delete next.looks;
  return next;
}

/** Pretty YAML 1.2 for files. Trailing newline so diffs stay tidy. */
export function workflowToYaml(doc: WorkflowDoc): string {
  return `${stringifyYaml(normalizeForFile(doc), YAML_STRINGIFY).trimEnd()}\n`;
}

/** Parse YAML or JSON text into an unknown value. Throws on syntax errors. */
export function parseWorkflowText(raw: string): unknown {
  return parseYaml(raw);
}

/** "Oak Park Invoice" → oak-park-invoice. Safe for a file, not a path. Empty when nothing survives. */
export function filenameSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_EXPORT_SLUG)
    .replace(/-+$/g, "");
}

/** Download name: "Oak Park Invoice" → oak-park-invoice.yaml. */
export function workflowExportFilename(doc: Pick<WorkflowDoc, "name">): string {
  return `${filenameSlug(projectDisplayName(doc)) || "untitled"}.yaml`;
}

export const WORKFLOW_YAML_MIME = "text/yaml";
export const WORKFLOW_JSON_MIME = "application/json";
