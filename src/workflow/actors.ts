/**
 * Actor roster helpers and pastel fills.
 * ActorColumn / HumanFigure sit on HUMAN_PRESETS; robots use ROBOT_COLORS[RobotKind].
 */
import { ActorKind, AssignmentLane, IdPrefix, RobotKind } from "./catalogs";
import { nid } from "./ids";
import {
  DEFAULT_HUMAN_ROLE,
  DEFAULT_ROBOT_NAME,
  DEFAULT_ROBOT_ROLE,
  isRobot,
  isStepNode,
  ROBOT_KIND_LABEL,
  stepDisplayLabel,
  type ActorDto,
  type RobotKind as RobotKindT,
  type WorkflowDoc,
} from "./types";

export const HUMAN_PRESETS = [
  { name: "Alice", color: "#ff9fbf" },
  { name: "Roy", color: "#f4c07a" },
  { name: "Jack", color: "#5ed4a4" },
  { name: "Missy", color: "#c89bf5" },
] as const;

export const ROBOT_COLORS = {
  [RobotKind.Llm]: "#5ec4d8",
  [RobotKind.Agent]: "#4dceb0",
  [RobotKind.Script]: "#6ab0c8",
} as const;

/** New-board robots: Name Robot, Role LLM / Script / Agent (WG-01, NA-01). */
export const ROBOT_PRESETS = [
  { name: DEFAULT_ROBOT_NAME, role: "LLM", robotKind: RobotKind.Llm },
  { name: DEFAULT_ROBOT_NAME, role: "Script", robotKind: RobotKind.Script },
  { name: DEFAULT_ROBOT_NAME, role: "Agent", robotKind: RobotKind.Agent },
] as const;

/** Color wheel presets. Kept away from default Human / Robot roster fills. */
export const ACTOR_COLOR_SWATCHES = [
  "#f26b6b",
  "#ff7a59",
  "#fbbf24",
  "#bef264",
  "#9ccc65",
  "#6b8cff",
  "#6366f1",
  "#d65db1",
] as const;

/** Stick-figure stroke on pastel actor fills (not theme ink, which goes light in dark mode). */
export const FIGURE_INK_ON_PASTEL = "#122836";

/** True for empty or picker-default white fills (not a usable Actor color). */
export function isBlankActorFill(color: string | undefined): boolean {
  const c = (color ?? "").trim().toLowerCase();
  return c === "" || c === "white" || c === "#fff" || c === "#ffffff" || c === "#ffffffff";
}

/** Put named roster Actors back on their preset fill if a picker wiped them to white. */
export function restoreBlankActorFills(actors: ActorDto[]): ActorDto[] {
  let changed = false;
  const next = actors.map((actor) => {
    if (!isBlankActorFill(actor.color)) return actor;
    const human = HUMAN_PRESETS.find((p) => p.name === actor.name);
    if (human) {
      changed = true;
      return { ...actor, color: human.color };
    }
    if (isRobot(actor)) {
      changed = true;
      return { ...actor, color: ROBOT_COLORS[actor.robotKind] };
    }
    return actor;
  });
  return changed ? next : actors;
}

/** Random human fill that stays in a quiet HSL band (skips lime/chartreuse). */
export function randomPastel(): string {
  let h = Math.floor(Math.random() * 360);
  if (h > 72 && h < 148) h = h < 110 ? h - 55 : h + 40;
  const s = 38 + Math.round(Math.random() * 12);
  const l = 80 + Math.round(Math.random() * 8);
  return `hsl(${h} ${s}% ${l}%)`;
}

/** Alice, Roy, Jack, Missy, then three Robots named Robot (WG-01). */
export function defaultActors(): ActorDto[] {
  const humans: ActorDto[] = HUMAN_PRESETS.map((p) => ({
    id: nid(IdPrefix.Human),
    kind: ActorKind.Human,
    name: p.name,
    color: p.color,
    role: DEFAULT_HUMAN_ROLE,
  }));
  const robots: ActorDto[] = ROBOT_PRESETS.map((p) => ({
    id: nid(IdPrefix.Robot),
    kind: ActorKind.Robot,
    name: p.name,
    color: ROBOT_COLORS[p.robotKind],
    robotKind: p.robotKind,
    role: p.role,
  }));
  return [...humans, ...robots];
}

/** Prefer Alice so new Steps match the demo’s default person. */
export function aliceId(actors: ActorDto[]) {
  return actors.find((a) => a.kind === ActorKind.Human && a.name === "Alice")?.id;
}

/**
 * Empty-board Add Step, or a child with no upstream Step Who: last-used
 * Human, else Alice, else the first Human (NA-03).
 */
export function defaultHumanId(
  actors: ActorDto[],
  lastHumanId?: string | null,
): string | undefined {
  if (lastHumanId) {
    const last = actors.find((a) => a.id === lastHumanId && a.kind === ActorKind.Human);
    if (last) return last.id;
  }
  return aliceId(actors) ?? actors.find((a) => a.kind === ActorKind.Human)?.id;
}

export type ChildStepWho = { beforeId?: string; afterId?: string };

/**
 * Who on a Step, or the nearest upstream Step when `startId` is Data (NA-03).
 */
function whoFromSourceOrUpstream(doc: WorkflowDoc, startId: string): string | undefined {
  const seen = new Set<string>();
  const queue = [startId];
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const node = doc.nodes.find((n) => n.id === id);
    if (!node) continue;
    if (isStepNode(node)) {
      const who = doc.assignments[id];
      if (who && doc.actors.some((a) => a.id === who)) return who;
      return undefined;
    }
    const incoming = doc.edges
      .filter((e) => e.target === id)
      .slice()
      .sort((a, b) => (a.source < b.source ? -1 : a.source > b.source ? 1 : 0));
    for (const e of incoming) queue.push(e.source);
  }
  return undefined;
}

/**
 * A new Before-origin Step hanging off `sourceId` (NA-03).
 * A Step parent stamps its Before Who on both lanes. A Data parent walks
 * incoming Paths to the nearest upstream Step. Otherwise last-used Human /
 * Alice. After-only Steps still use the default Robot.
 */
export function whoForChildStep(
  doc: WorkflowDoc,
  sourceId: string,
  lastHumanId?: string | null,
): ChildStepWho {
  const inherited = whoFromSourceOrUpstream(doc, sourceId);
  if (inherited) return { beforeId: inherited, afterId: inherited };
  const human = defaultHumanId(doc.actors, lastHumanId);
  return human ? { beforeId: human, afterId: human } : {};
}

/**
 * A new predecessor Step (left + / Q). Inherits Who from the successor Tile
 * the same way a child inherits from its parent (NA-03).
 */
export function whoForPredecessorStep(
  doc: WorkflowDoc,
  successorId: string,
  lastHumanId?: string | null,
): ChildStepWho {
  return whoForChildStep(doc, successorId, lastHumanId);
}

/** First robot on the roster (NA-04). */
export function defaultRobotId(actors: ActorDto[]) {
  return actors.find((a) => a.kind === ActorKind.Robot)?.id;
}

/**
 * After-only Step: use the default Robot (first on the roster; Robot / LLM
 * on a new board). If the roster has none, create Robot / Script (NA-04).
 */
export function ensureDefaultRobot(doc: WorkflowDoc): { doc: WorkflowDoc; robotId: string } {
  const existing = defaultRobotId(doc.actors);
  if (existing) return { doc, robotId: existing };
  const robot = makeRobot();
  return { doc: { ...doc, actors: insertActor(doc.actors, robot) }, robotId: robot.id };
}

export type ActorUse = {
  stepId: string;
  lane: typeof AssignmentLane.Before | typeof AssignmentLane.After;
  title: string;
};

function stepTitle(doc: WorkflowDoc, stepId: string): string {
  const n =
    doc.nodes.find((x) => x.id === stepId) ??
    doc.after.extraNodes.find((x) => x.id === stepId);
  if (!n) return stepId;
  if (isStepNode(n)) return stepDisplayLabel(n.stepKind, n.title);
  return n.label;
}

/** Assignments in Before, After, and After-only extra Steps (NA-02). */
export function actorUsages(doc: WorkflowDoc, actorId: string): ActorUse[] {
  const uses: ActorUse[] = [];
  for (const [stepId, id] of Object.entries(doc.assignments)) {
    if (id === actorId) {
      uses.push({
        stepId,
        lane: AssignmentLane.Before,
        title: stepTitle(doc, stepId),
      });
    }
  }
  for (const [stepId, id] of Object.entries(doc.after.assignments)) {
    if (id === actorId) {
      uses.push({
        stepId,
        lane: AssignmentLane.After,
        title: stepTitle(doc, stepId),
      });
    }
  }
  return uses;
}

export function actorInUseMessage(actorName: string, uses: ActorUse[]): string {
  const detail = uses
    .map((u) => `${u.title} (${u.lane === AssignmentLane.Before ? "Before" : "After"})`)
    .join(", ");
  return `${actorName} is assigned to ${detail}.`;
}

/** Unused-only deletion (NA-02). Callers surface `message` when blocked. */
export function removeActor(
  doc: WorkflowDoc,
  actorId: string,
): { ok: true; value: WorkflowDoc } | { ok: false; code: string; message: string } {
  const actor = doc.actors.find((a) => a.id === actorId);
  if (!actor) {
    return { ok: false, code: "missing-actor", message: "That actor is not on the roster." };
  }
  const uses = actorUsages(doc, actorId);
  if (uses.length) {
    return { ok: false, code: "actor-in-use", message: actorInUseMessage(actor.name, uses) };
  }
  return { ok: true, value: { ...doc, actors: doc.actors.filter((a) => a.id !== actorId) } };
}


/** Humans in document order (display and insert helpers). */
export function humansOf(actors: ActorDto[]): ActorDto[] {
  return actors.filter((a) => a.kind === ActorKind.Human);
}

/** Robots in document order (display and insert helpers). */
export function robotsOf(actors: ActorDto[]): ActorDto[] {
  return actors.filter((a) => a.kind === ActorKind.Robot);
}

/**
 * Add a Human after the last Human, or a Robot after the last Robot.
 * A Human with none yet goes at the front; a Robot with none yet goes at the end.
 */
export function insertActor(actors: ActorDto[], actor: ActorDto): ActorDto[] {
  const kind = actor.kind;
  let last = -1;
  for (let i = 0; i < actors.length; i++) {
    if (actors[i].kind === kind) last = i;
  }
  if (kind === ActorKind.Robot && last === -1) return [...actors, actor];
  const next = actors.slice();
  next.splice(last + 1, 0, actor);
  return next;
}

/** Inspector “Add human”. Unnamed Humans are “Human” (no number). */
export function makeHuman(name?: string, color?: string): ActorDto {
  const n = name?.trim() || "Human";
  const preset = HUMAN_PRESETS.find((p) => p.name === n);
  const c = color ?? preset?.color ?? randomPastel();
  return {
    id: nid(IdPrefix.Human),
    kind: ActorKind.Human,
    name: n,
    color: c,
    role: DEFAULT_HUMAN_ROLE,
  };
}

/** Inspector “Add robot”. Name Robot, Role Script, hidden Type Script (NA-01). */
export function makeRobot(
  name = DEFAULT_ROBOT_NAME,
  robotKind: RobotKindT = RobotKind.Script,
  role?: string,
): ActorDto {
  return {
    id: nid(IdPrefix.Robot),
    kind: ActorKind.Robot,
    name,
    color: ROBOT_COLORS[robotKind],
    robotKind,
    role: role?.trim() || ROBOT_KIND_LABEL[robotKind] || DEFAULT_ROBOT_ROLE,
  };
}
