/**
 * Actor roster helpers and pastel fills.
 * ActorColumn / HumanFigure sit on HUMAN_PRESETS; robots use ROBOT_COLORS[RobotKind].
 */
import { ActorKind, AssignmentLane, IdPrefix, RobotKind } from "./catalogs";
import { nid } from "./ids";
import {
  DEFAULT_HUMAN_ROLE,
  isStepNode,
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

/** Stick-figure stroke on pastel actor fills (not theme ink, which goes light in dark mode). */
export const FIGURE_INK_ON_PASTEL = "#122836";

/** Random human fill that stays in a quiet HSL band (skips lime/chartreuse). */
export function randomPastel(): string {
  let h = Math.floor(Math.random() * 360);
  if (h > 72 && h < 148) h = h < 110 ? h - 55 : h + 40;
  const s = 38 + Math.round(Math.random() * 12);
  const l = 80 + Math.round(Math.random() * 8);
  return `hsl(${h} ${s}% ${l}%)`;
}

/** Alice, Roy, Jack, Missy, plus one Script robot — also used by New board. */
export function defaultActors(): ActorDto[] {
  const humans: ActorDto[] = HUMAN_PRESETS.map((p) => ({
    id: nid(IdPrefix.Human),
    kind: ActorKind.Human,
    name: p.name,
    color: p.color,
    role: DEFAULT_HUMAN_ROLE,
  }));
  const robot: ActorDto = {
    id: nid(IdPrefix.Robot),
    kind: ActorKind.Robot,
    name: "Robot",
    color: ROBOT_COLORS[RobotKind.Script],
    robotKind: RobotKind.Script,
  };
  return [...humans, robot];
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

/** First robot on the roster (NA-04). */
export function defaultRobotId(actors: ActorDto[]) {
  return actors.find((a) => a.kind === ActorKind.Robot)?.id;
}

/**
 * After merge / After-only Step: use the default Robot, creating a Script
 * Robot named "Robot" in the same undo step when the roster has none (NA-04).
 */
export function ensureDefaultRobot(doc: WorkflowDoc): { doc: WorkflowDoc; robotId: string } {
  const existing = defaultRobotId(doc.actors);
  if (existing) return { doc, robotId: existing };
  const robot = makeRobot("Robot", RobotKind.Script);
  return { doc: { ...doc, actors: [...doc.actors, robot] }, robotId: robot.id };
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

/** Inspector “Add human”. */
export function makeHuman(name?: string, color?: string): ActorDto {
  const n = name?.trim() || `Person ${Math.floor(Math.random() * 90) + 2}`;
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

/** Inspector “Add robot”. Name stays “Robot”; kind drives fill. */
export function makeRobot(
  name = "Robot",
  robotKind: RobotKindT = RobotKind.Script,
): ActorDto {
  return {
    id: nid(IdPrefix.Robot),
    kind: ActorKind.Robot,
    name,
    color: ROBOT_COLORS[robotKind],
    robotKind,
  };
}
