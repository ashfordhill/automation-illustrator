/**
 * Workflow files. Export and Save copy write `.illustrator`: pretty JSON of the
 * v2 document under a `type` / `version` / `source` header, like `.excalidraw`.
 * Import reads `.illustrator` plus older `.yaml` / `.yml` / `.json` exports
 * through one YAML 1.2 parser (JSON is a subset). Demo fixtures stay YAML.
 * Browser localStorage stays pretty JSON without the header (see persistence.ts).
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

/** `type` that marks a `.illustrator` file. */
export const ILLUSTRATOR_FILE_TYPE = "automation-illustrator";
export const ILLUSTRATOR_FILE_EXTENSION = ".illustrator";
/** Fixed rather than the page origin, so a board exports the same bytes from any host. */
export const ILLUSTRATOR_FILE_SOURCE = "https://github.com/ashfordhill/automation-illustrator";
export const ILLUSTRATOR_FILE_MIME = "application/vnd.automation-illustrator+json";
/** Import picker: `.illustrator` plus older YAML / JSON exports. */
export const WORKFLOW_FILE_ACCEPT =
  ".illustrator,.yaml,.yml,.json,application/json,text/yaml,text/x-yaml,application/yaml";

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

/**
 * Fill blanks so a dropped demo YAML still parses (empty Human role is worker).
 * Keys follow the schema order so a board writes the same bytes however it was
 * edited: a name or look book added mid-session would otherwise land last.
 * Fields not listed here still pass through, after the listed ones.
 */
function normalizeForFile(doc: WorkflowDoc): WorkflowDoc {
  const { version, name, actors, nodes, edges, assignments, looks, after, ...unlisted } = doc;
  const {
    assignments: afterWho,
    groups,
    extraNodes,
    extraEdges,
    fork,
    looks: afterLooks,
    ...unlistedAfter
  } = after;
  const beforeBook = looksForFile(looks);
  const afterBook = afterLooks == null ? undefined : (looksForFile(afterLooks) ?? {});
  return {
    version,
    ...(name === undefined ? {} : { name }),
    actors: actors.map((actor) => {
      if (isHuman(actor)) {
        const role = actor.role.trim() || DEFAULT_HUMAN_ROLE;
        const { accessories: _omit, ...rest } = actor as typeof actor & { accessories?: unknown };
        return { ...rest, role };
      }
      if (isRobot(actor)) return { ...actor, role: robotRole(actor) };
      return actor;
    }),
    nodes,
    edges,
    assignments,
    ...(beforeBook ? { looks: beforeBook } : {}),
    after: {
      assignments: afterWho,
      groups,
      extraNodes,
      extraEdges,
      fork: fork ?? null,
      ...(afterBook ? { looks: afterBook } : {}),
      ...unlistedAfter,
    },
    ...unlisted,
  };
}

/**
 * How the exporter saw the board: orientation and the applied theme. Renderers
 * draw with it; Import ignores it, so the importer's preferences stay their own.
 */
export type FileAppearance = {
  orientation: "horizontal" | "vertical";
  theme: {
    name: string;
    colors: Record<string, string>;
    texture: { pattern: string; color: string };
  };
};

/** `.illustrator` text: header first, then the document. Trailing newline so diffs stay tidy. */
export function workflowToIllustrator(doc: WorkflowDoc, appearance?: FileAppearance): string {
  const { version, ...body } = normalizeForFile(doc);
  const file = {
    type: ILLUSTRATOR_FILE_TYPE,
    version,
    source: ILLUSTRATOR_FILE_SOURCE,
    ...(appearance ? { appearance } : {}),
    ...body,
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

/** Pretty YAML 1.2, the format Export wrote before `.illustrator`. Import still reads it. */
export function workflowToYaml(doc: WorkflowDoc): string {
  return `${stringifyYaml(normalizeForFile(doc), YAML_STRINGIFY).trimEnd()}\n`;
}

/** Parse YAML or JSON text into an unknown value. Throws on syntax errors. */
export function parseWorkflowText(raw: string): unknown {
  return parseYaml(raw);
}

/**
 * Drop the `.illustrator` header so the rest validates as a document.
 * Files without `type` (older YAML / JSON exports) pass through unchanged.
 * Null when `type` names some other format, such as an `.excalidraw` file.
 */
export function stripFileHeader(data: Record<string, unknown>): Record<string, unknown> | null {
  if (!("type" in data)) return data;
  if (data.type !== ILLUSTRATOR_FILE_TYPE) return null;
  const { type: _type, source: _source, appearance: _appearance, ...doc } = data;
  return doc;
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

/** Download name: "Oak Park Invoice" → oak-park-invoice.illustrator. */
export function workflowExportFilename(doc: Pick<WorkflowDoc, "name">): string {
  return `${filenameSlug(projectDisplayName(doc)) || "untitled"}${ILLUSTRATOR_FILE_EXTENSION}`;
}

export const WORKFLOW_YAML_MIME = "text/yaml";
export const WORKFLOW_JSON_MIME = "application/json";
