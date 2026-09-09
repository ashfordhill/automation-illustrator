/**
 * YAML interchange for a WorkflowDoc (Export, Import, demo fixtures).
 * YAML 1.2 is a JSON superset, so Import also accepts JSON files.
 * Browser localStorage stays pretty JSON (see persistence.ts).
 */
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { DEFAULT_HUMAN_ROLE, isHuman, projectDisplayName, type WorkflowDoc } from "./types";

const YAML_STRINGIFY = { indent: 2, lineWidth: 0 } as const;
const MAX_EXPORT_SLUG = 80;

/** Fill blanks so a dropped demo YAML still parses (empty Human role is worker). */
function normalizeForFile(doc: WorkflowDoc): WorkflowDoc {
  return {
    ...doc,
    actors: doc.actors.map((actor) =>
      isHuman(actor) ? { ...actor, role: actor.role.trim() || DEFAULT_HUMAN_ROLE } : actor,
    ),
  };
}

/** Pretty YAML 1.2 for files. Trailing newline so diffs stay tidy. */
export function workflowToYaml(doc: WorkflowDoc): string {
  return `${stringifyYaml(normalizeForFile(doc), YAML_STRINGIFY).trimEnd()}\n`;
}

/** Parse YAML or JSON text into an unknown value. Throws on syntax errors. */
export function parseWorkflowText(raw: string): unknown {
  return parseYaml(raw);
}

/** Download name: "Oak Park Invoice" → oak-park-invoice.yaml. Safe for a file, not a path. */
export function workflowExportFilename(doc: Pick<WorkflowDoc, "name">): string {
  const slug = projectDisplayName(doc)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_EXPORT_SLUG)
    .replace(/-+$/g, "");
  return `${slug || "untitled"}.yaml`;
}

export const WORKFLOW_YAML_MIME = "text/yaml";
export const WORKFLOW_JSON_MIME = "application/json";
