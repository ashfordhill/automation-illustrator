/**
 * Global keydown handler for undo, pan, help, Present Space/Escape,
 * selected-tile Q/E Step and A/D Data spawn, and Delete/Remove. Mounted once from app/App.tsx.
 */
import { useEffect } from "react";
import { panBy } from "../board/reactFlowBridge";
import { KeyAction, SelectionKind, ViewMode, WorkflowNodeKind } from "../workflow/catalogs";
import { useStore } from "../state/store";
import { isTransient } from "../state/interaction";
import { actionFor, eventKey, keyIs, type KeyAction as KeyActionT } from "./bindings";

/** True when Delete/Backspace should edit the field instead of the board. */
function isEditingText(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el.tagName === "TEXTAREA") {
    return !(el as HTMLTextAreaElement).readOnly && !(el as HTMLTextAreaElement).disabled;
  }
  if (el.tagName !== "INPUT") return false;
  const input = el as HTMLInputElement;
  if (input.readOnly || input.disabled) return false;
  const type = (input.type || "text").toLowerCase();
  return !["button", "checkbox", "color", "file", "hidden", "radio", "reset", "submit"].includes(
    type,
  );
}

function isDeleteKey(e: KeyboardEvent) {
  return e.key === "Delete" || e.code === "Delete";
}

/** Install window keydown — skip when typing in inputs unless capturing a rebind. */
export function useAppKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState();
      const map = s.keymap;

      if (s.capturing) {
        e.preventDefault();
        if (e.key === "Escape") {
          s.setCapturing(null);
          return;
        }
        if (e.key === "Backspace" || e.key === "Delete") {
          s.setKey(s.capturing, "");
          return;
        }
        s.setKey(s.capturing, eventKey(e));
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (s.present) return;
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        if (s.present) return;
        e.preventDefault();
        s.redo();
        return;
      }

      const action = actionFor(map, e);
      const editingText = isEditingText(e.target);

      if (s.present && action === KeyAction.ToggleView) {
        e.preventDefault();
        s.togglePresentLane();
        return;
      }

      if (action === KeyAction.Help) {
        e.preventDefault();
        s.setHelp(!s.helpOpen);
        return;
      }

      if (e.key === "Escape") {
        if (isTransient(s.interaction)) {
          e.preventDefault();
          s.closeBoardModes();
          return;
        }
        if (s.manageActorsOpen) {
          e.preventDefault();
          s.closeManageActors();
          return;
        }
        if (s.helpOpen || s.pendingReplace || s.recovery || s.importError) {
          return;
        }
        if (s.present) {
          e.preventDefault();
          if (s.presentExpand) {
            s.setPresentExpand(null);
            return;
          }
          s.setPresent(false);
          return;
        }
      }

      if (editingText) return;
      if (
        s.helpOpen ||
        s.pendingReplace ||
        s.recovery ||
        s.importError
      ) {
        return;
      }

      const readOnlyBoard = s.present || s.view === ViewMode.Both;

        if (
          !readOnlyBoard &&
          (s.interaction.kind === "plus-pull" ||
            s.interaction.kind === "path-pull" ||
            s.interaction.kind === "tile-drag" ||
            s.interaction.kind === "path-label-edit")
        ) {
          return;
        }

      if (!readOnlyBoard && s.interaction.kind === "remove-preview") {
        if (keyIs(map, KeyAction.Confirm, e) || e.key === "Enter") {
          e.preventDefault();
          s.confirmRemove();
          return;
        }
        return;
      }

      if (!readOnlyBoard && s.interaction.kind === "connect-existing") {
        if (keyIs(map, KeyAction.RemoveNode, e) || isDeleteKey(e) || action === KeyAction.Delete) {
          e.preventDefault();
          s.removeTarget(s.interaction.sourceId);
          return;
        }
        return;
      }

      if (!readOnlyBoard && s.selected?.type === SelectionKind.Edge) {
        if (keyIs(map, KeyAction.ToggleDash, e)) {
          e.preventDefault();
          s.toggleSelectedDash();
          return;
        }
        if (keyIs(map, KeyAction.Confirm, e) || e.key === "Enter") {
          e.preventDefault();
          s.focusPathLabel();
          return;
        }
      }

      if (!readOnlyBoard && s.selected?.type === SelectionKind.Node) {
        const n = s.workflow.nodes.find((x) => x.id === s.selected!.id)
          ?? s.workflow.after.extraNodes.find((x) => x.id === s.selected!.id);
        if (
          n?.type === WorkflowNodeKind.DataField &&
          (keyIs(map, KeyAction.Confirm, e) || e.key === "Enter")
        ) {
          e.preventDefault();
          s.focusDataLabel();
          return;
        }
        if (keyIs(map, KeyAction.AddStepOut, e)) {
          e.preventDefault();
          s.spawnBranch(s.selected.id, WorkflowNodeKind.Step, "out");
          return;
        }
        if (keyIs(map, KeyAction.AddStepIn, e)) {
          e.preventDefault();
          s.spawnBranch(s.selected.id, WorkflowNodeKind.Step, "in");
          return;
        }
        if (keyIs(map, KeyAction.AddDataOut, e)) {
          e.preventDefault();
          if (s.view === ViewMode.After) return;
          s.spawnBranch(s.selected.id, WorkflowNodeKind.DataField, "out");
          return;
        }
        if (keyIs(map, KeyAction.AddDataIn, e)) {
          e.preventDefault();
          if (s.view === ViewMode.After) return;
          s.spawnBranch(s.selected.id, WorkflowNodeKind.DataField, "in");
          return;
        }
        if (keyIs(map, KeyAction.AddPath, e) || keyIs(map, KeyAction.LinkExisting, e)) {
          e.preventDefault();
          return;
        }
        if (keyIs(map, KeyAction.RemoveNode, e)) {
          e.preventDefault();
          s.removeTarget(s.selected.id);
          return;
        }
      }

      if (
        !readOnlyBoard &&
        s.selected &&
        (isDeleteKey(e) || action === KeyAction.Delete)
      ) {
        e.preventDefault();
        s.deleteSelection();
        return;
      }

      if (!s.present && action === KeyAction.Undo) {
        e.preventDefault();
        s.undo();
        return;
      }

      if (s.present) return;

      const pan: Partial<Record<KeyActionT, [number, number]>> = {
        [KeyAction.PanLeft]: [80, 0],
        [KeyAction.PanRight]: [-80, 0],
        [KeyAction.PanUp]: [0, 80],
        [KeyAction.PanDown]: [0, -80],
      };
      if (action && pan[action]) {
        e.preventDefault();
        panBy(...pan[action]!, s.focusedLane);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);
}
