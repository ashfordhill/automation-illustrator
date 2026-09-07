/**
 * Right inspector: Step / Data / Path forms, Who, Manage actors (NA-01..12, PC-02..03).
 */
import { Button, Stack, Text, TextInput } from "@mantine/core";
import {
  SelectionKind,
  SplitKind,
  WorkflowNodeKind,
} from "../../workflow/catalogs";
import { edgeIsDotted } from "../../workflow/graph";
import { laneAssignments } from "../../workflow/types";
import { useStore } from "../../state/store";
import { ManageActorsPanel } from "./ManageActorsPanel";
import { TypeButtons } from "./TypeButtons";
import { WhoButtons } from "./WhoButtons";

function ManageActorsButton() {
  return (
    <Button
      id="manage-actors-btn"
      size="xs"
      variant="light"
      onClick={() => useStore.getState().openManageActors()}
    >
      Manage actors
    </Button>
  );
}

function FatChoice({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inspector-fat-row" role="group" aria-label={label}>
      {options.map((opt) => {
        const on = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            className={`inspector-fat${on ? " is-on" : ""}`}
            aria-pressed={on}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function DetailsPanel() {
  const selected = useStore((s) => s.selected);
  const workflow = useStore((s) => s.workflow);
  const lane = useStore((s) => s.assignmentLane());
  const manageOpen = useStore((s) => s.manageActorsOpen);

  if (manageOpen) return <ManageActorsPanel />;

  if (!selected) {
    return (
      <Stack gap="sm" p="sm" className="chrome-hide">
        <Text size="sm" className="hint-copy">
          Select a tile or Path to edit.
        </Text>
        <ManageActorsButton />
      </Stack>
    );
  }

  if (selected.type === SelectionKind.Node) {
    const n = workflow.nodes.find((x) => x.id === selected.id);
    if (!n) return null;
    if (n.type === WorkflowNodeKind.DataField) {
      return (
        <Stack gap="xs" p="sm" className="chrome-hide">
          <Text fw={800}>Data</Text>
          <TextInput
            id="data-label-field"
            label="Label"
            value={n.label}
            onChange={(e) => useStore.getState().updateNode(n.id, { label: e.target.value })}
          />
          <Button color="red" variant="light" size="xs" onClick={() => useStore.getState().beginRemovePick(n.id)}>
            Remove
          </Button>
        </Stack>
      );
    }
    const actorId = laneAssignments(workflow, lane)[n.id] ?? "";
    const outs = workflow.edges.filter((e) => e.source === n.id).length;
    return (
      <Stack gap="xs" p="sm" className="chrome-hide">
        <Text fw={800}>Step</Text>
        <Text size="sm" fw={700}>
          Type
        </Text>
        <TypeButtons
          value={n.stepKind}
          onChange={(stepKind) => useStore.getState().updateNode(n.id, { stepKind })}
        />
        {outs >= 2 ? (
          <>
            <Text size="sm" fw={700}>
              Split: One of / Every
            </Text>
            <FatChoice
              label="Split: One of / Every"
              value={n.split}
              onChange={(v) =>
                useStore.getState().updateNode(n.id, { split: v as typeof n.split })
              }
              options={[
                { value: SplitKind.Exclusive, label: "One of" },
                { value: SplitKind.Parallel, label: "Every" },
              ]}
            />
          </>
        ) : null}
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
        <Text size="sm" fw={700}>
          Who
        </Text>
        <WhoButtons
          actors={workflow.actors}
          value={actorId}
          onChange={(id) => useStore.getState().assignActor(n.id, id)}
        />
        <ManageActorsButton />
        <Button color="red" variant="light" size="xs" onClick={() => useStore.getState().beginRemovePick(n.id)}>
          Remove
        </Button>
      </Stack>
    );
  }

  if (selected.type === SelectionKind.Edge) {
    const e = workflow.edges.find((x) => x.id === selected.id);
    if (!e) return null;
    const outs = workflow.edges.filter((x) => x.source === e.source).length;
    const dotted = edgeIsDotted(workflow.nodes, workflow.edges, e);
    return (
      <Stack gap="xs" p="sm" className="chrome-hide">
        <Text fw={800}>Path / condition</Text>
        <TextInput
          id="path-condition-field"
          label="condition"
          value={e.label}
          onChange={(ev) => useStore.getState().updateEdge(e.id, { label: ev.target.value })}
        />
        <Text size="sm" fw={700}>
          Always visited (solid) / Choice (dotted)
        </Text>
        <FatChoice
          label="Always visited (solid) / Choice (dotted)"
          value={dotted ? "dotted" : "solid"}
          disabled={outs < 2}
          onChange={(v) => useStore.getState().updateEdge(e.id, { dashed: v === "dotted" })}
          options={[
            { value: "solid", label: "Always visited (solid)" },
            { value: "dotted", label: "Choice (dotted)" },
          ]}
        />
      </Stack>
    );
  }

  return (
    <Stack gap="sm" p="sm" className="chrome-hide">
      <Text size="sm" className="hint-copy">
        Select a tile or Path to edit.
      </Text>
      <ManageActorsButton />
    </Stack>
  );
}
