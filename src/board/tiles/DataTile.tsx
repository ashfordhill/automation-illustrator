/**
 * Rounded Data-field tile (Account # and similar).
 * Mounted by board/nodes/DataFieldNode.tsx; mark is DataChip.
 */
import { FIELD_H, FIELD_W } from "../layout/tileMetrics";
import { DataChip } from "./DataChip";
import { FitLabel } from "./FitLabel";

export function DataTile({
  label,
  selected,
  lifted,
}: {
  label: string;
  selected?: boolean;
  lifted?: boolean;
}) {
  const text = label.trim() || "Data";
  return (
    <div
      className={`board-node field-piece${selected ? " selected" : ""}${lifted ? " is-lifted" : ""}`}
      style={{
        width: FIELD_W,
        height: FIELD_H,
        border: `3px solid var(--line)`,
        borderRadius: 32,
        background: "var(--cream)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        color: "var(--ink)",
        transform: lifted ? "translateY(-3px)" : undefined,
        transition: "transform 140ms ease",
        overflow: "hidden",
        padding: "8px 10px",
        boxSizing: "border-box",
      }}
    >
      <DataChip />
      <div className="data-label">
        <FitLabel text={text} maxFontSizePx={14} mode="box" maxLines={3} />
      </div>
    </div>
  );
}
