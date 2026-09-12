/**
 * Status-bar Right-click delete toggle. Mouse mark plus “delete”; hover is on/off.
 */
import { Tooltip } from "@mantine/core";
import { useStore } from "../../state/store";
import { MouseRightClickIcon } from "./MouseRightClickIcon";

const ICON_SIZE = 14;

export const RIGHT_CLICK_DELETE_LABEL = "Right-click delete";

export function RightClickDeleteToggle() {
  const rightClickDelete = useStore((s) => s.rightClickDelete);
  const hint = rightClickDelete ? "Right-click delete on" : "Right-click delete off";

  return (
    <span className="status-sound">
      <Tooltip label={hint}>
        <button
          type="button"
          className={`status-toggle status-mouse${rightClickDelete ? " is-on" : ""}`}
          aria-pressed={rightClickDelete}
          aria-label={RIGHT_CLICK_DELETE_LABEL}
          data-status="right-click-delete"
          onClick={() => {
            const s = useStore.getState();
            s.setRightClickDelete(!s.rightClickDelete);
          }}
        >
          <MouseRightClickIcon size={ICON_SIZE} />
          delete
        </button>
      </Tooltip>
    </span>
  );
}
