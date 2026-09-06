/**
 * Copy for the right-rail footer (and Present toolbar): how many steps
 * flip from a person Before to a robot After.
 */
import { ActorKind, AssignmentLane, WorkflowNodeKind } from "../model/catalogs";
import type { WorkflowDoc } from "../model/types";

export function automationScore(workflow: WorkflowDoc): string {
  const steps = workflow.nodes.filter((n) => n.type === WorkflowNodeKind.Step);
  const automated = steps.filter((n) => {
    const beforeId = workflow.assignments[AssignmentLane.Before][n.id];
    const afterId = workflow.assignments[AssignmentLane.After][n.id];
    const before = workflow.actors.find((a) => a.id === beforeId);
    const after = workflow.actors.find((a) => a.id === afterId);
    return before?.kind !== ActorKind.Robot && after?.kind === ActorKind.Robot;
  }).length;
  const total = steps.length;
  if (!total) return "No steps yet.";
  return `${automated} Step${automated === 1 ? "" : "s"} out of ${total} will become automated instead of manually performed`;
}
