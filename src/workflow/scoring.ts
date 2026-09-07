/**
 * Copy for the right-rail footer (and Present toolbar): how many steps
 * flip from a person Before to a robot After (BA-08).
 */
import { ActorKind, WorkflowNodeKind } from "./catalogs";
import type { WorkflowDoc } from "./types";

/** Before-origin Step counts only; After-only Steps are omitted (BA-08). */
export function automationCounts(workflow: WorkflowDoc): { automated: number; total: number } {
  const extraIds = new Set(workflow.after.extraNodes.map((n) => n.id));
  const steps = workflow.nodes.filter(
    (n) => n.type === WorkflowNodeKind.Step && !extraIds.has(n.id),
  );
  const automated = steps.filter((n) => {
    const beforeId = workflow.assignments[n.id];
    const afterId = workflow.after.assignments[n.id];
    const before = workflow.actors.find((a) => a.id === beforeId);
    const after = workflow.actors.find((a) => a.id === afterId);
    return before?.kind !== ActorKind.Robot && after?.kind === ActorKind.Robot;
  }).length;
  return { automated, total: steps.length };
}

export function automationScore(workflow: WorkflowDoc): string {
  const { automated, total } = automationCounts(workflow);
  if (!total) return "No steps yet.";
  return `${automated} Step${automated === 1 ? "" : "s"} out of ${total} will become automated instead of manually performed`;
}
