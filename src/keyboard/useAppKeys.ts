/**
 * Global keydown handler for tools, undo, pan, help, present toggle, path pick,
 * + submenu, and path label / dash. Mounted once from app/App.tsx.
 */
import { useEffect } from "react";
import { panBy } from "../board/reactFlowBridge";
import { KeyAction, SelectionKind, Tool, ViewMode, WorkflowNodeKind } from "../workflow/catalogs";
import { useStore } from "../state/store";
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
        s.setKey(s.capturing, eventKey(e));
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        s.redo();
        return;
      }

      const action = actionFor(map, e);
      const editingText = isEditingText(e.target);

      if (s.present && action === KeyAction.ToggleView) {
        e.preventDefault();
        s.setView(s.view === ViewMode.After ? ViewMode.Before : ViewMode.After);
        return;
      }

      if (action === KeyAction.Help) {
        e.preventDefault();
        s.setHelp(!s.helpOpen);
        return;
      }

      if (e.key === "Escape") {
        if (s.linkFrom || s.pathPick || s.linkMenu) {
          e.preventDefault();
          s.closeBoardModes();
          return;
        }
      }

      if (editingText) return;
      if (s.present || s.helpOpen || s.newConfirmOpen) return;

      if (s.pathPick) {
        const up =
          keyIs(map, KeyAction.PanUp, e) ||
          e.key === "w" ||
          e.key === "ArrowUp" ||
          e.key === "W";
        const down =
          keyIs(map, KeyAction.PanDown, e) ||
          e.key === "s" ||
          e.key === "ArrowDown" ||
          e.key === "S";
        if (up) {
          e.preventDefault();
          s.cyclePathPick(-1);
          return;
        }
        if (down) {
          e.preventDefault();
          s.cyclePathPick(1);
          return;
        }
        if (keyIs(map, KeyAction.PathConfirm, e) || e.key === "Enter") {
          e.preventDefault();
          s.confirmPathPick();
          return;
        }
      }

      if (s.linkMenu) {
        e.preventDefault();
        if (keyIs(map, KeyAction.AddBranchStep, e)) {
          s.spawnBranch(s.linkMenu, WorkflowNodeKind.Step);
          return;
        }
        if (keyIs(map, KeyAction.AddBranchData, e)) {
          s.spawnBranch(s.linkMenu, WorkflowNodeKind.DataField);
          return;
        }
        if (keyIs(map, KeyAction.LinkExisting, e)) {
          s.beginLinkFrom(s.linkMenu);
          return;
        }
        if (keyIs(map, KeyAction.DetachPath, e)) {
          s.beginPathPick(s.linkMenu);
          return;
        }
        if (keyIs(map, KeyAction.AddPath, e)) {
          s.openLinkMenu(s.linkMenu);
          return;
        }
        return;
      }

      if (s.linkFrom) {
        if (keyIs(map, KeyAction.DetachPath, e)) {
          e.preventDefault();
          s.beginPathPick(s.linkFrom);
          return;
        }
        return;
      }

      if (s.selected?.type === SelectionKind.Edge) {
        if (keyIs(map, KeyAction.ToggleDash, e)) {
          e.preventDefault();
          s.toggleSelectedDash();
          return;
        }
        if (keyIs(map, KeyAction.PathConfirm, e) || e.key === "Enter") {
          e.preventDefault();
          s.focusPathLabel();
          return;
        }
      }

      if (s.selected?.type === SelectionKind.Node) {
        if (keyIs(map, KeyAction.AddPath, e)) {
          e.preventDefault();
          s.openLinkMenu(s.selected.id);
          return;
        }
        if (keyIs(map, KeyAction.DetachPath, e)) {
          e.preventDefault();
          s.beginPathPick(s.selected.id);
          return;
        }
      }

      if (
        s.selected &&
        (isDeleteKey(e) || action === KeyAction.Delete)
      ) {
        e.preventDefault();
        s.deleteSelection();
        return;
      }

      if (action === KeyAction.ToolPointer) {
        s.setTool(Tool.Pointer);
        return;
      }
      if (action === KeyAction.ToolHand) {
        s.setTool(Tool.Hand);
        return;
      }
      if (action === KeyAction.Undo) {
        e.preventDefault();
        s.undo();
        return;
      }

      const pan: Partial<Record<KeyActionT, [number, number]>> = {
        [KeyAction.PanLeft]: [80, 0],
        [KeyAction.PanRight]: [-80, 0],
        [KeyAction.PanUp]: [0, 80],
        [KeyAction.PanDown]: [0, -80],
      };
      if (action && pan[action]) {
        e.preventDefault();
        panBy(...pan[action]!);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);
}
