/**
 * Right inspector: idle Actors roster, or the selected Step / Data / Path form.
 * Both is read-only comparison (BA-05). After edits its own copy, never Before.
 */
import { ActionIcon, Stack, Text, TextInput, Tooltip } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import {
  ColorScheme,
  SelectionKind,
  StepKind,
  ViewMode,
  WorkflowNodeKind,
} from "../../workflow/catalogs";
import { ACTOR_COLOR_SWATCHES } from "../../workflow/actors";
import { edgeIsDotted } from "../../workflow/graph";
import { laneAssignments, laneBoard, STEP_KIND_META } from "../../workflow/types";
import { findNode } from "../../workflow/selectors";
import { DATA_MARK_DARK, DATA_MARK_LIGHT } from "../../board/tiles/DataChip";
import { useStore } from "../../state/store";
import { ColorField } from "../theme/ColorField";
import { InspectorField } from "./InspectorField";
import { ManageActorsPanel } from "./ManageActorsPanel";
import { TypeButtons } from "./TypeButtons";
import { WhoButtons } from "./WhoButtons";
import "./compareDisabled.css";

const DATA_COLOR_SWATCHES = [DATA_MARK_LIGHT, DATA_MARK_DARK, ...ACTOR_COLOR_SWATCHES];

function InspectorHeader({
  title,
  removeLabel,
  onRemove,
  onActors,
}: {
  title?: string;
  removeLabel?: string;
  onRemove?: () => void;
  onActors?: () => void;
}) {
  const showTrash = Boolean(removeLabel && onRemove);
  if (!title && !showTrash && !onActors) return null;
  return (
    <div className={`inspector-header${title ? "" : " is-tools"}`}>
      {title ? <Text fw={800}>{title}</Text> : <span />}
      <div className="inspector-header-tools">
        {onActors ? (
          <button
            id="manage-actors-btn"
            type="button"
            className="inspector-actors"
            onClick={onActors}
          >
            Actors
          </button>
        ) : null}
        {removeLabel && onRemove ? (
          <Tooltip label={removeLabel}>
            <ActionIcon
              className="inspector-trash"
              variant="default"
              aria-label={removeLabel}
              onClick={onRemove}
              styles={{
                root: { color: "var(--trash)" },
                icon: { color: "var(--trash)" },
              }}
            >
              <IconTrash size={22} color="var(--trash)" stroke={2.2} />
            </ActionIcon>
          </Tooltip>
        ) : null}
      </div>
    </div>
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
  const scheme = useStore((s) => s.colorScheme);
  const actorsFromTile = useStore(
    (s) => s.manageActorsOpen && s.manageActorsSource === "tile",
  );
  const readOnly = view === ViewMode.Both;
  const selectedNode =
    selected?.type === SelectionKind.Node ? findNode(workflow, selected.id, lane) : undefined;
  const showRemove =
    !readOnly &&
    Boolean(selectedNode) &&
    (view === ViewMode.Before || view === ViewMode.After);
  const tileSelected =
    selectedNode?.type === WorkflowNodeKind.Step ||
    selectedNode?.type === WorkflowNodeKind.DataField;
  const removeLabel = selectedNode
    ? selectedNode.type === WorkflowNodeKind.DataField
      ? "Remove Data"
      : "Remove Step"
    : undefined;

  if (actorsFromTile && !readOnly) {
    return (
      <Stack gap="xs" p="sm" className="chrome-hide">
        <div className="inspector-header is-tools">
          <div className="inspector-header-tools is-back">
            <button
              type="button"
              className="inspector-back"
              onClick={() => useStore.getState().closeManageActors()}
            >
              Back
            </button>
          </div>
        </div>
        <ManageActorsPanel />
      </Stack>
    );
  }

  const header = (
    <InspectorHeader
      title={selectedNode?.type === WorkflowNodeKind.DataField ? "Data" : undefined}
      removeLabel={showRemove ? removeLabel : undefined}
      onRemove={
        showRemove && selectedNode
          ? () => useStore.getState().removeTarget(selectedNode.id)
          : undefined
      }
      onActors={
        !readOnly && tileSelected ? () => useStore.getState().openManageActors() : undefined
      }
    />
  );

  if (!selected) {
    if (readOnly) {
      return (
        <Stack gap="sm" p="sm" className="chrome-hide">
          {header}
        </Stack>
      );
    }
    return (
      <Stack gap="xs" p="sm" className="chrome-hide">
        <ManageActorsPanel />
      </Stack>
    );
  }

  if (selected.type === SelectionKind.Node) {
    const n = selectedNode;
    if (!n) return null;
    if (n.type === WorkflowNodeKind.DataField) {
      const fallback = scheme === ColorScheme.Dark ? DATA_MARK_DARK : DATA_MARK_LIGHT;
      const mark = n.color?.trim() || fallback;
      return (
        <Stack gap="xs" p="sm" className="chrome-hide">
          {header}
          <div className="inspector-actor-edit">
            <div className="inspector-actor-edit-text">
              <TextInput
                id="data-label-field"
                label="Label"
                value={n.label}
                disabled={readOnly}
                onChange={(e) => useStore.getState().updateNode(n.id, { label: e.target.value })}
              />
            </div>
            <ColorField
              value={mark}
              ariaLabel="Data color"
              disabled={readOnly}
              swatches={DATA_COLOR_SWATCHES}
              onChange={(color) => useStore.getState().updateNode(n.id, { color })}
            />
          </div>
        </Stack>
      );
    }
    const actorId = laneAssignments(workflow, lane)[n.id] ?? "";
    return (
      <Stack gap="xs" p="sm" className="chrome-hide">
        {header}
        <TypeButtons
          value={n.stepKind}
          disabled={readOnly}
          onChange={(stepKind) => useStore.getState().updateNode(n.id, { stepKind })}
        />
        <div className="inspector-fields">
          <InspectorField
            id="step-name-field"
            ariaLabel="Name"
            prefixSlot
            prefix={n.stepKind === StepKind.Other ? undefined : STEP_KIND_META[n.stepKind].label}
            value={n.title}
            disabled={readOnly}
            onChange={(title) => useStore.getState().updateNode(n.id, { title })}
          />
          <InspectorField
            id="step-details-field"
            ariaLabel="Details"
            prefixSlot
            value={n.detail}
            disabled={readOnly}
            onChange={(detail) => useStore.getState().updateNode(n.id, { detail })}
          />
        </div>
        <WhoButtons
          actors={workflow.actors}
          value={actorId}
          disabled={readOnly}
          onChange={(id) => useStore.getState().assignActor(n.id, id)}
        />
      </Stack>
    );
  }

  if (selected.type === SelectionKind.Edge) {
    const board = laneBoard(workflow, lane);
    const e = board.edges.find((edge) => edge.id === selected.id);
    if (!e) return null;
    const dotted = edgeIsDotted(board.nodes, board.edges, e);
    return (
      <Stack gap="xs" p="sm" className="chrome-hide">
        {header}
        <TextInput
          id="path-condition-field"
          label="label"
          value={e.label}
          disabled={readOnly}
          onChange={(ev) => useStore.getState().updateEdge(e.id, { label: ev.target.value })}
        />
        <FatChoice
          label="Path stroke"
          value={dotted ? "dotted" : "solid"}
          disabled={readOnly}
          onChange={(v) => useStore.getState().updateEdge(e.id, { dashed: v === "dotted" })}
          options={[
            { value: "dotted", label: "Dotted" },
            { value: "solid", label: "Solid" },
          ]}
        />
      </Stack>
    );
  }

  return (
    <Stack gap="sm" p="sm" className="chrome-hide">
      {header}
    </Stack>
  );
}
