import { expect, test } from "vitest";
import { DemoId, workflowForDemo } from "./catalog";
import { freshBoard, isEmptyBoard, oakParkInvoice, OAK_PARK_IDS } from "./oakParkInvoice";
import { MAILROOM_IDS, robotMailroom } from "./robotMailroom";
import { ActorKind, RobotKind } from "../workflow/catalogs";
import { edgeIsDotted, validateWorkflow } from "../workflow/graph";

test("Oak Park IDs are deterministic and both amount Paths are dotted (PC-06)", () => {
  const a = oakParkInvoice();
  const b = oakParkInvoice();
  expect(a.nodes.map((n) => n.id)).toEqual(b.nodes.map((n) => n.id));
  expect(a.nodes.map((n) => n.id)).toEqual([
    OAK_PARK_IDS.read,
    OAK_PARK_IDS.web,
    OAK_PARK_IDS.fs,
    OAK_PARK_IDS.acct,
    OAK_PARK_IDS.enter,
    OAK_PARK_IDS.review,
    OAK_PARK_IDS.review2,
    OAK_PARK_IDS.review3,
  ]);
  const gt = a.edges.find((e) => e.id === OAK_PARK_IDS.gt)!;
  const lt = a.edges.find((e) => e.id === OAK_PARK_IDS.lt)!;
  expect(gt.dashed).toBe(true);
  expect(lt.dashed).toBe(true);
  expect(edgeIsDotted(a.nodes, a.edges, gt)).toBe(true);
  expect(edgeIsDotted(a.nodes, a.edges, lt)).toBe(true);
  expect(validateWorkflow(a)).toEqual([]);
  const write = a.nodes.find((n) => n.id === OAK_PARK_IDS.enter);
  expect(write && "detail" in write && write.detail).toBe("invoice details");
  expect(a.assignments[OAK_PARK_IDS.review]).toBe(OAK_PARK_IDS.roy);
  expect(a.assignments[OAK_PARK_IDS.review2]).toBe(OAK_PARK_IDS.jack);
  expect(a.assignments[OAK_PARK_IDS.review3]).toBe(OAK_PARK_IDS.missy);
  expect(a.after.assignments[OAK_PARK_IDS.read]).toBe(OAK_PARK_IDS.llm);
  expect(a.after.assignments[OAK_PARK_IDS.web]).toBe(OAK_PARK_IDS.llm);
  expect(a.after.assignments[OAK_PARK_IDS.fs]).toBe(OAK_PARK_IDS.llm);
  expect(a.after.assignments[OAK_PARK_IDS.enter]).toBe(OAK_PARK_IDS.robot);
  expect(a.after.assignments[OAK_PARK_IDS.review]).toBe(OAK_PARK_IDS.roy);
  const llm = a.actors.find((actor) => actor.id === OAK_PARK_IDS.llm);
  const script = a.actors.find((actor) => actor.id === OAK_PARK_IDS.robot);
  expect(llm && "robotKind" in llm && llm.robotKind).toBe(RobotKind.Llm);
  expect(llm?.name).toBe("LLM");
  expect(script && "robotKind" in script && script.robotKind).toBe(RobotKind.Script);
  expect(script?.name).toBe("Script");
});

test("Robot Mailroom matches Appendix A overlay", () => {
  const doc = robotMailroom();
  expect(validateWorkflow(doc)).toEqual([]);
  expect(doc.actors.map((a) => a.id)).toEqual([
    MAILROOM_IDS.dana,
    MAILROOM_IDS.omar,
    MAILROOM_IDS.priya,
    MAILROOM_IDS.mailbot,
    MAILROOM_IDS.reader,
  ]);
  expect(doc.after.groups).toEqual([]);
  expect(doc.after.assignments[MAILROOM_IDS.scan]).toBe(MAILROOM_IDS.mailbot);
  expect(doc.after.assignments[MAILROOM_IDS.lookup]).toBe(MAILROOM_IDS.mailbot);
  expect(doc.after.assignments[MAILROOM_IDS.route]).toBe(MAILROOM_IDS.mailbot);
  expect(doc.after.extraNodes.map((n) => n.id)).toEqual([MAILROOM_IDS.receipt]);
  expect(doc.after.extraEdges.map((e) => e.id)).toEqual([MAILROOM_IDS.extra]);
  expect(doc.assignments[MAILROOM_IDS.priya]).toBeUndefined();
  expect(doc.actors.find((a) => a.id === MAILROOM_IDS.priya)?.kind).toBe(ActorKind.Human);
  const found = doc.edges.find((e) => e.id === MAILROOM_IDS.e4)!;
  const missing = doc.edges.find((e) => e.id === MAILROOM_IDS.e5)!;
  expect(edgeIsDotted(doc.nodes, doc.edges, found)).toBe(true);
  expect(edgeIsDotted(doc.nodes, doc.edges, missing)).toBe(true);
});

test("freshBoard is an empty roster board (WG-01)", () => {
  const doc = freshBoard();
  expect(isEmptyBoard(doc)).toBe(true);
  expect(doc.actors).toHaveLength(7);
  expect(doc.actors.filter((a) => a.kind === ActorKind.Human).map((a) => a.name)).toEqual([
    "Alice",
    "Roy",
    "Jack",
    "Missy",
  ]);
  expect(doc.actors.filter((a) => a.kind === ActorKind.Robot).map((a) => a.name)).toEqual([
    "Robot",
    "Robot",
    "Robot",
  ]);
  expect(
    doc.actors.filter((a) => a.kind === ActorKind.Robot).map((a) => ("role" in a ? a.role : "")),
  ).toEqual(["LLM", "Script", "Agent"]);
  expect(validateWorkflow(doc)).toEqual([]);
});

test("demo catalog loaders return the matching fixture", () => {
  expect(workflowForDemo(DemoId.OakPark).nodes[0]?.id).toBe(OAK_PARK_IDS.read);
  expect(workflowForDemo(DemoId.RobotMailroom).nodes[0]?.id).toBe(MAILROOM_IDS.open);
});
