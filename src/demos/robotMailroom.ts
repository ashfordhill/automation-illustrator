/**
 * Robot Mailroom showcase — hamburger Demo item.
 * After is individual Before-origin Steps (Robot Who where it was merged)
 * plus an After-only receipt Step. SH-07 demo IDs stay.
 */
import { HUMAN_PRESETS, ROBOT_COLORS } from "../workflow/actors";
import {
  ActorKind,
  RobotKind,
  SplitKind,
  StepKind,
  WorkflowNodeKind,
  WORKFLOW_VERSION,
} from "../workflow/catalogs";
import { emptyAfterOverlay, type WorkflowDoc } from "../workflow/types";

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

export function robotMailroom(): WorkflowDoc {
  const id = MAILROOM_IDS;

  return {
    version: WORKFLOW_VERSION,
    actors: [
      {
        id: id.dana,
        kind: ActorKind.Human,
        name: "Dana",
        color: "#f4a06a",
        role: "Mail clerk",
      },
      {
        id: id.omar,
        kind: ActorKind.Human,
        name: "Omar",
        color: "#7eb6f5",
        role: "Records",
      },
      {
        id: id.priya,
        kind: ActorKind.Human,
        name: "Priya",
        color: HUMAN_PRESETS[3].color,
        role: "Accounts payable",
      },
      {
        id: id.mailbot,
        kind: ActorKind.Robot,
        name: "Mailbot",
        color: ROBOT_COLORS[RobotKind.Script],
        robotKind: RobotKind.Script,
      },
      {
        id: id.reader,
        kind: ActorKind.Robot,
        name: "Reader",
        color: ROBOT_COLORS[RobotKind.Llm],
        robotKind: RobotKind.Llm,
      },
    ],
    nodes: [
      {
        id: id.open,
        type: WorkflowNodeKind.Step,
        position: { x: 32, y: 160 },
        stepKind: StepKind.Read,
        title: "incoming mail",
        detail: "",
        split: SplitKind.Exclusive,
      },
      {
        id: id.scan,
        type: WorkflowNodeKind.Step,
        position: { x: 352, y: 160 },
        stepKind: StepKind.Scan,
        title: "letter to PDF",
        detail: "",
        split: SplitKind.Exclusive,
      },
      {
        id: id.recipient,
        type: WorkflowNodeKind.DataField,
        position: { x: 672, y: 192 },
        label: "Recipient",
      },
      {
        id: id.lookup,
        type: WorkflowNodeKind.Step,
        position: { x: 864, y: 160 },
        stepKind: StepKind.Search,
        title: "staff directory",
        detail: "",
        split: SplitKind.Exclusive,
      },
      {
        id: id.route,
        type: WorkflowNodeKind.Step,
        position: { x: 1184, y: 32 },
        stepKind: StepKind.Email,
        title: "PDF to recipient",
        detail: "",
        split: SplitKind.Exclusive,
      },
      {
        id: id.call,
        type: WorkflowNodeKind.Step,
        position: { x: 1184, y: 352 },
        stepKind: StepKind.Call,
        title: "sender for details",
        detail: "",
        split: SplitKind.Exclusive,
      },
      {
        id: id.file,
        type: WorkflowNodeKind.Step,
        position: { x: 1504, y: 352 },
        stepKind: StepKind.File,
        title: "original in archive",
        detail: "",
        split: SplitKind.Exclusive,
      },
    ],
    edges: [
      { id: id.e1, source: id.open, target: id.scan, label: "", dashed: false },
      { id: id.e2, source: id.scan, target: id.recipient, label: "", dashed: false },
      { id: id.e3, source: id.recipient, target: id.lookup, label: "", dashed: false },
      {
        id: id.e4,
        source: id.lookup,
        target: id.route,
        label: "recipient found",
        dashed: true,
      },
      {
        id: id.e5,
        source: id.lookup,
        target: id.call,
        label: "no recipient",
        dashed: true,
      },
      { id: id.e6, source: id.route, target: id.file, label: "", dashed: false },
      { id: id.e7, source: id.call, target: id.file, label: "", dashed: false },
    ],
    assignments: {
      [id.open]: id.dana,
      [id.scan]: id.dana,
      [id.lookup]: id.dana,
      [id.route]: id.dana,
      [id.call]: id.omar,
      [id.file]: id.omar,
    },
    after: {
      ...emptyAfterOverlay(),
      assignments: {
        [id.open]: id.dana,
        [id.scan]: id.mailbot,
        [id.lookup]: id.mailbot,
        [id.route]: id.mailbot,
        [id.call]: id.omar,
        [id.file]: id.omar,
        [id.receipt]: id.mailbot,
      },
      groups: [],
      extraNodes: [
        {
          id: id.receipt,
          type: WorkflowNodeKind.Step,
          position: { x: 1504, y: 32 },
          stepKind: StepKind.Email,
          title: "delivery receipt to sender",
          detail: "",
          split: SplitKind.Exclusive,
        },
      ],
      extraEdges: [
        {
          id: id.extra,
          source: id.route,
          target: id.receipt,
          label: "",
          dashed: false,
        },
      ],
    },
  };
}
