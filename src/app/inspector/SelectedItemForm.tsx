/**
 * Right inspector: Step / Data / Path forms, Who, Manage actors (NA-01..12, PC-02..03).
 * Both is read-only comparison (BA-05). After-only Nodes/Paths resolve from the overlay.
 */
import { Button, Stack, Text, TextInput } from "@mantine/core";
import {
  SelectionKind,
  SplitKind,
  ViewMode,
  WorkflowNodeKind,
} from "../../workflow/catalogs";
import { afterGraph } from "../../workflow/graph";
import { isStepNode, laneAssignments } from "../../workflow/types";
import { findEdge, findMergeGroup, findNode, isAfterOnlyNode } from "../../workflow/selectors";
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
  const view = useStore((s) => s.view);
  const manageOpen = useStore((s) => s.manageActorsOpen);
  const readOnly = view === ViewMode.Both;

  if (manageOpen) return <ManageActorsPanel />;

  if (!selected) {
    return (
      <Stack gap="sm" p="sm" className="chrome-hide">
        {readOnly ? null : <ManageActorsButton />}
      </Stack>
    );
  }

  if (selected.type === SelectionKind.Node) {
    const group = findMergeGroup(workflow, selected.id);
    if (group) {
      const names = group.memberIds.map((id) => {
        const n = findNode(workflow, id);
        if (n && isStepNode(n)) return n.title.trim() || n.stepKind;
        return id;
      });
      const whoId = laneAssignments(workflow, lane)[group.memberIds[0] ?? ""] ?? "";
      return (
        <Stack gap="xs" p="sm" className="chrome-hide">
          <Text fw={800}>Merged Steps</Text>
          <Text size="sm" className="hint-copy">
            {names.join(" · ") || "Merged Before-origin Steps."}
          </Text>
          <Text size="sm" fw={700}>
            Who
          </Text>
          <WhoButtons
            actors={workflow.actors}
            value={whoId}
            onChange={(id) => useStore.getState().assignActor(group.id, id)}
            disabled={readOnly}
          />
          {readOnly ? null : (
            <Button
              color="red"
              variant="light"
              size="xs"
              onClick={() => useStore.getState().unmerge(group.id)}
            >
              Unmerge
            </Button>
          )}
        </Stack>
      );
    }

    const n = findNode(workflow, selected.id);
    if (!n) return null;
    const extra = isAfterOnlyNode(workflow, n.id);
    const showRemove =
      !readOnly &&
      (view === ViewMode.Before || (view === ViewMode.After && extra));
    if (n.type === WorkflowNodeKind.DataField) {
      return (
        <Stack gap="xs" p="sm" className="chrome-hide">
          <Text fw={800}>Data</Text>
          <TextInput
            id="data-label-field"
            label="Label"
            value={n.label}
            readOnly={readOnly}
            onChange={(e) => useStore.getState().updateNode(n.id, { label: e.target.value })}
          />
          {showRemove ? (
            <Button color="red" variant="light" size="xs" onClick={() => useStore.getState().beginRemovePick(n.id)}>
              Remove
            </Button>
          ) : null}
        </Stack>
      );
    }
    const actorId = laneAssignments(workflow, lane)[n.id] ?? "";
    const graph = extra ? afterGraph(workflow) : { nodes: workflow.nodes, edges: workflow.edges };
    const outs = graph.edges.filter((e) => e.source === n.id).length;
    return (
      <Stack gap="xs" p="sm" className="chrome-hide">
        <Text fw={800}>Step</Text>
        <Text size="sm" fw={700}>
          Type
        </Text>
        <TypeButtons
          value={n.stepKind}
          disabled={readOnly}
          onChange={(stepKind) => useStore.getState().updateNode(n.id, { stepKind })}
        />
        {outs >= 2 ? (
          <>
            <Text size="sm" fw={700}>
              Path
            </Text>
            <FatChoice
              label="Path: 1 Path vs All Paths"
              value={n.split}
              disabled={readOnly}
              onChange={(v) =>
                useStore.getState().updateNode(n.id, { split: v as typeof n.split })
              }
              options={[
                { value: SplitKind.Exclusive, label: "1 Path" },
                { value: SplitKind.Parallel, label: "All Paths" },
              ]}
            />
          </>
        ) : null}
        <TextInput
          id="step-name-field"
          label="Name"
          value={n.title}
          readOnly={readOnly}
          onChange={(e) => useStore.getState().updateNode(n.id, { title: e.target.value })}
        />
        <TextInput
          id="step-details-field"
          label="Details"
          value={n.detail}
          readOnly={readOnly}
          onChange={(e) => useStore.getState().updateNode(n.id, { detail: e.target.value })}
        />
        <Text size="sm" fw={700}>
          Who
        </Text>
        <WhoButtons
          actors={workflow.actors}
          value={actorId}
          disabled={readOnly}
          onChange={(id) => useStore.getState().assignActor(n.id, id)}
        />
        {readOnly ? null : <ManageActorsButton />}
        {showRemove ? (
          <Button color="red" variant="light" size="xs" onClick={() => useStore.getState().beginRemovePick(n.id)}>
            Remove
          </Button>
        ) : null}
      </Stack>
    );
  }

  if (selected.type === SelectionKind.Edge) {
    const e = findEdge(workflow, selected.id);
    if (!e) return null;
    return (
      <Stack gap="xs" p="sm" className="chrome-hide">
        <TextInput
          id="path-condition-field"
          label="label"
          value={e.label}
          readOnly={readOnly}
          onChange={(ev) => useStore.getState().updateEdge(e.id, { label: ev.target.value })}
        />
      </Stack>
    );
  }

  return (
    <Stack gap="sm" p="sm" className="chrome-hide">
      {readOnly ? null : <ManageActorsButton />}
    </Stack>
  );
}
