/**
 * Form for the current selection (Step, Data, Path, or actor).
 * App mounts DetailsPanel above the score in the right inspector.
 */
import { Button, ColorInput, Select, SegmentedControl, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { ROBOT_COLORS } from "../../workflow/actors";
import {
  ActorKind,
  AssignmentLane,
  RobotKind,
  SelectionKind,
  SplitKind,
  WorkflowNodeKind,
} from "../../workflow/catalogs";
import { edgeIsDotted } from "../../workflow/graph";
import {
  DEFAULT_HUMAN_ROLE,
  ROBOT_KIND_LABEL,
  STEP_KINDS,
  STEP_KIND_META,
  laneAssignments,
  type RobotKind as RobotKindT,
  type StepKind,
} from "../../workflow/types";
import { useStore } from "../../state/store";

export function DetailsPanel() {
  const selected = useStore((s) => s.selected);
  const workflow = useStore((s) => s.workflow);
  const lane = useStore((s) => s.assignmentLane());
  if (!selected) {
    return (
      <Text size="sm" p="sm" className="chrome-hide hint-copy">
        Select a tile or arrow to edit.
      </Text>
    );
  }
  if (selected.type === SelectionKind.Node) {
    const n = workflow.nodes.find((x) => x.id === selected.id);
    if (!n) return null;
    if (n.type === WorkflowNodeKind.DataField) {
      return (
        <Stack gap="xs" p="sm" className="chrome-hide">
          <Text fw={800}>Data field</Text>
          <TextInput
            label="Label"
            value={n.label}
            onChange={(e) => useStore.getState().updateNode(n.id, { label: e.target.value })}
          />
          <Button color="red" variant="light" size="xs" onClick={() => useStore.getState().deleteSelection()}>
            Delete
          </Button>
        </Stack>
      );
    }
    const actorId = laneAssignments(workflow, lane)[n.id] ?? "";
    const humans = workflow.actors.filter((a) => a.kind === ActorKind.Human);
    const robots = workflow.actors.filter((a) => a.kind === ActorKind.Robot);
    const actorOptions =
      lane === AssignmentLane.Before ? humans : [...humans, ...robots];
    const outs = workflow.edges.filter((e) => e.source === n.id).length;
    return (
      <Stack gap="xs" p="sm" className="chrome-hide">
        <Text fw={800}>Step</Text>
        <Select
          label="Type"
          value={n.stepKind}
          data={STEP_KINDS.map((k) => ({ value: k, label: STEP_KIND_META[k].label }))}
          onChange={(v) =>
            v && useStore.getState().updateNode(n.id, { stepKind: v as StepKind })
          }
        />
        <TextInput
          label="Target"
          value={n.title}
          onChange={(e) => useStore.getState().updateNode(n.id, { title: e.target.value })}
        />
        <TextInput
          label="System / detail"
          value={n.detail}
          onChange={(e) => useStore.getState().updateNode(n.id, { detail: e.target.value })}
        />
        <Select
          label="Who"
          value={actorId}
          data={actorOptions.map((a) => ({ value: a.id, label: a.name }))}
          onChange={(v) => v && useStore.getState().assignActor(n.id, v)}
        />
        {actorId ? (
          <Button
            size="xs"
            variant="light"
            onClick={() => useStore.getState().select({ type: SelectionKind.Actor, id: actorId })}
          >
            Edit person
          </Button>
        ) : null}
        <Button
          size="xs"
          variant="light"
          onClick={() => {
            const id = useStore.getState().addHuman();
            useStore.getState().assignActor(n.id, id);
          }}
        >
          + New person
        </Button>
        {lane === AssignmentLane.After ? (
          <Button
            size="xs"
            variant="light"
            onClick={() => {
              const id = useStore.getState().addRobot();
              useStore.getState().assignActor(n.id, id);
            }}
          >
            + New robot
          </Button>
        ) : null}
        {outs >= 2 ? (
          <Select
            label="Split"
            value={n.split}
            data={[
              {
                value: SplitKind.Exclusive,
                label: "Exclusive (one path)",
              },
              {
                value: SplitKind.Parallel,
                label: "Parallel (every path)",
              },
            ]}
            onChange={(v) =>
              v && useStore.getState().updateNode(n.id, { split: v as typeof n.split })
            }
          />
        ) : null}
        <Button color="red" variant="light" size="xs" onClick={() => useStore.getState().deleteSelection()}>
          Delete
        </Button>
      </Stack>
    );
  }
  if (selected.type === SelectionKind.Edge) {
    const e = workflow.edges.find((x) => x.id === selected.id);
    if (!e) return null;
    return (
      <Stack gap="xs" p="sm" className="chrome-hide">
        <Text fw={800}>Arrow</Text>
        <TextInput
          id="path-label-field"
          label="Label"
          value={e.label}
          onChange={(ev) => useStore.getState().updateEdge(e.id, { label: ev.target.value })}
        />
        <Text size="sm" fw={700}>
          Line
        </Text>
        <SegmentedControl
          fullWidth
          size="xs"
          value={edgeIsDotted(workflow.nodes, workflow.edges, e) ? "dotted" : "solid"}
          onChange={(v) => useStore.getState().updateEdge(e.id, { dashed: v === "dotted" })}
          data={[
            { value: "solid", label: "Solid" },
            { value: "dotted", label: "Dotted" },
          ]}
        />
      </Stack>
    );
  }
  const a = workflow.actors.find((x) => x.id === selected.id);
  if (!a) return null;
  return (
    <Stack gap="xs" p="sm" className="chrome-hide">
      <Text fw={800}>{a.kind === ActorKind.Human ? "Human" : "Robot"}</Text>
      <TextInput
        label="Name"
        value={a.name}
        onChange={(e) => useStore.getState().updateActor(a.id, { name: e.target.value })}
      />
      <ColorInput
        label="Color"
        value={a.color}
        onChange={(color) => useStore.getState().updateActor(a.id, { color })}
      />
      {a.kind === ActorKind.Human ? (
        <Textarea
          label="Role"
          value={a.role ?? DEFAULT_HUMAN_ROLE}
          placeholder={DEFAULT_HUMAN_ROLE}
          autosize
          minRows={2}
          maxRows={4}
          onChange={(e) => useStore.getState().updateActor(a.id, { role: e.target.value })}
        />
      ) : (
        <Select
          label="Type"
          value={a.robotKind}
          data={Object.values(RobotKind).map((k) => ({
            value: k,
            label: ROBOT_KIND_LABEL[k],
          }))}
          onChange={(v) => {
            if (!v) return;
            const robotKind = v as RobotKindT;
            useStore.getState().updateActor(a.id, {
              robotKind,
              color: ROBOT_COLORS[robotKind],
            });
          }}
        />
      )}
    </Stack>
  );
}
