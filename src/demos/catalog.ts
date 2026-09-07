/**
 * Hamburger Demo chooser (SH-05). Loaders return deterministic v2 documents.
 */
import { oakParkInvoice } from "./oakParkInvoice";
import { robotMailroom } from "./robotMailroom";
import type { WorkflowDoc } from "../workflow/types";

export const DemoId = {
  OakPark: "oak-park",
  RobotMailroom: "robot-mailroom",
} as const;
export type DemoId = (typeof DemoId)[keyof typeof DemoId];

export const DEMO_CHOICES: { id: DemoId; name: string }[] = [
  { id: DemoId.OakPark, name: "Oak Park Invoice" },
  { id: DemoId.RobotMailroom, name: "Robot Mailroom" },
];

export function workflowForDemo(id: DemoId): WorkflowDoc {
  return id === DemoId.RobotMailroom ? robotMailroom() : oakParkInvoice();
}

export function demoName(id: DemoId): string {
  return DEMO_CHOICES.find((item) => item.id === id)?.name ?? "Demo";
}
