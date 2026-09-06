/**
 * Load/save the workflow document as JSON (Import menu + CLI export shape).
 * Theme and keybind keys live here so persist concerns stay in one module.
 */
import { ActorKind, AssignmentLane, ColorScheme, WORKFLOW_VERSION } from "../workflow/catalogs";
import { DEFAULT_HUMAN_ROLE, emptyWorkflow, type ActorDto, type WorkflowDoc } from "../workflow/types";

/** Pretty JSON for localStorage and the Import file picker. */
export function toJson(doc: WorkflowDoc): string {
  return JSON.stringify({ ...doc, version: WORKFLOW_VERSION }, null, 2);
}

/** Older boards omit HumanDto.role; fill worker so tiles and details always have it. */
function withHumanRoles(actors: ActorDto[]): ActorDto[] {
  return actors.map((a) => {
    if (a.kind !== ActorKind.Human) return a;
    const role = typeof a.role === "string" && a.role.trim() ? a.role.trim() : DEFAULT_HUMAN_ROLE;
    return { ...a, role };
  });
}

/** Parse a saved board; throws if version is missing or wrong. */
export function fromJson(raw: string): WorkflowDoc {
  const parsed = JSON.parse(raw) as Partial<WorkflowDoc>;
  if (!parsed || parsed.version !== WORKFLOW_VERSION) {
    throw new Error("This file is not an Automation Pitch workflow.");
  }
  return {
    ...emptyWorkflow(),
    actors: withHumanRoles((parsed.actors ?? []) as ActorDto[]),
    nodes: parsed.nodes ?? [],
    edges: parsed.edges ?? [],
    assignments: {
      [AssignmentLane.Before]: parsed.assignments?.[AssignmentLane.Before] ?? {},
      [AssignmentLane.After]: parsed.assignments?.[AssignmentLane.After] ?? {},
    },
  };
}

export const LS_WORKFLOW = "automation-pitch.workflow";
export const LS_KEYMAP = "automation-pitch.keymap";
export const LS_THEME = "automation-pitch.theme";

/** Last chosen light/dark; Toolbar hamburger toggles this. */
export function loadTheme(): ColorScheme {
  try {
    const v = localStorage.getItem(LS_THEME);
    if (v === ColorScheme.Dark || v === ColorScheme.Light) return v;
  } catch {
    /* ignore */
  }
  return ColorScheme.Light;
}

export function saveTheme(scheme: ColorScheme) {
  localStorage.setItem(LS_THEME, scheme);
}

/** Parse localStorage or return undefined when missing/invalid (caller falls back to demo). */
export function loadStoredWorkflow(): WorkflowDoc | undefined {
  try {
    const raw = localStorage.getItem(LS_WORKFLOW);
    return raw ? fromJson(raw) : undefined;
  } catch {
    return undefined;
  }
}

export function persistWorkflow(w: WorkflowDoc) {
  localStorage.setItem(LS_WORKFLOW, toJson(w));
}
