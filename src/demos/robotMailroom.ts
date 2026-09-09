/**
 * Robot Mailroom showcase — hamburger Demo item.
 * The document lives in robot-mailroom.yaml. IDs stay here for tests.
 */
import mailroomYaml from "./robot-mailroom.yaml?raw";
import type { WorkflowDoc } from "../workflow/types";
import { cloneWorkflow, loadYamlFixture } from "./loadYamlFixture";

export const MAILROOM_IDS = {
  dana: "h_dana",
  omar: "h_omar",
  priya: "h_priya",
  mailbot: "r_mailbot",
  reader: "r_reader",
  open: "s_mail_open",
  scan: "s_mail_scan",
  recipient: "d_recipient",
  lookup: "s_mail_lookup",
  route: "s_mail_route",
  call: "s_mail_call",
  file: "s_mail_file",
  receipt: "s_mail_receipt",
  e1: "e_mail_1",
  e2: "e_mail_2",
  e3: "e_mail_3",
  e4: "e_mail_4",
  e5: "e_mail_5",
  e6: "e_mail_6",
  e7: "e_mail_7",
  extra: "e_mail_x1",
  group: "g_mail_sort",
} as const;

const MAILROOM = loadYamlFixture(mailroomYaml, "Robot Mailroom");

export function robotMailroom(): WorkflowDoc {
  return cloneWorkflow(MAILROOM);
}
