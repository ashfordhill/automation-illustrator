/**
 * Add / edit / delete humans and robots in the right inspector (NA-01, NA-02, NA-06).
 */
import { useEffect, useRef } from "react";
import { Button, ColorInput, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { HUMAN_PRESETS, ROBOT_COLORS } from "../../workflow/actors";
import { ActorKind, RobotKind } from "../../workflow/catalogs";
import {
  DEFAULT_HUMAN_ROLE,
  ROBOT_KIND_LABEL,
  isRobot,
  type RobotKind as RobotKindT,
} from "../../workflow/types";
import { useStore } from "../../state/store";
import { ActorWhoGrid } from "./ActorWhoGrid";

const ROBOT_KINDS: RobotKindT[] = [RobotKind.Llm, RobotKind.Agent, RobotKind.Script];

export function ManageActorsPanel() {
  const workflow = useStore((s) => s.workflow);
  const actorId = useStore((s) => s.manageActorId);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const actor = workflow.actors.find((a) => a.id === actorId) ?? null;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <Stack gap="xs" p="sm" className="chrome-hide inspector-manage">
      <h2 ref={headingRef} tabIndex={-1} className="inspector-heading">
        Manage actors
      </h2>
      <Button
        size="xs"
        variant="light"
        onClick={() => useStore.getState().closeManageActors()}
      >
        Back
      </Button>
      <ActorWhoGrid
        actors={workflow.actors}
        selectedId={actorId}
        listbox
        ariaLabel="Actors"
        onPick={(id) => useStore.getState().setManageActorId(id)}
      />
      <div className="inspector-fat-row">
        <Button
          size="xs"
          variant="light"
          onClick={() => useStore.getState().addHuman()}
        >
          Add human
        </Button>
        <Button
          size="xs"
          variant="light"
          onClick={() => useStore.getState().addRobot()}
        >
          Add robot
        </Button>
      </div>
      {actor ? (
        <>
          <TextInput
            label="Name"
            value={actor.name}
            onChange={(e) =>
              useStore.getState().updateActor(actor.id, { name: e.target.value })
            }
          />
          <ColorInput
            label="Color"
            value={actor.color}
            format="hex"
            swatches={[
              ...HUMAN_PRESETS.map((p) => p.color),
              ...Object.values(ROBOT_COLORS),
            ]}
            onChange={(color) => {
              if (!color.trim()) return;
              useStore.getState().updateActor(actor.id, { color });
            }}
          />
          {actor.kind === ActorKind.Human ? (
            <Textarea
              label="Role"
              value={actor.role ?? DEFAULT_HUMAN_ROLE}
              placeholder={DEFAULT_HUMAN_ROLE}
              autosize
              minRows={2}
              maxRows={4}
              onChange={(e) =>
                useStore.getState().updateActor(actor.id, { role: e.target.value })
              }
            />
          ) : (
            <div className="inspector-fat-row" role="group" aria-label="Type">
              {ROBOT_KINDS.map((kind) => {
                const on = isRobot(actor) && actor.robotKind === kind;
                return (
                  <button
                    key={kind}
                    type="button"
                    className={`inspector-fat${on ? " is-on" : ""}`}
                    aria-pressed={on}
                    onClick={() =>
                      useStore.getState().updateActor(actor.id, {
                        robotKind: kind,
                        color: ROBOT_COLORS[kind],
                      })
                    }
                  >
                    {ROBOT_KIND_LABEL[kind]}
                  </button>
                );
              })}
            </div>
          )}
          <Button
            color="red"
            variant="light"
            size="xs"
            onClick={() => useStore.getState().removeActor(actor.id)}
          >
            Delete actor
          </Button>
        </>
      ) : (
        <Text size="sm" className="hint-copy">
          Add a Human or Robot, or pick one to edit.
        </Text>
      )}
    </Stack>
  );
}
