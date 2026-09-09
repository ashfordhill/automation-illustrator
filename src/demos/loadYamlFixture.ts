/**
 * Load a demo YAML file through the same parser as Import.
 */
import { parseDocument } from "../workflow/migrate";
import type { WorkflowDoc } from "../workflow/types";

export function loadYamlFixture(raw: string, label: string): WorkflowDoc {
  const parsed = parseDocument(raw);
  if (!parsed.ok) {
    throw new Error(`${label} YAML is not a valid workflow: ${parsed.message}`);
  }
  return parsed.doc;
}

export function cloneWorkflow(doc: WorkflowDoc): WorkflowDoc {
  return structuredClone(doc);
}
