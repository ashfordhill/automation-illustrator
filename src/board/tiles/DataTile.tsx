/**
 * Rounded Data-field tile (Account # and similar).
 * Mounted by board/nodes/DataFieldNode.tsx; mark is DataChip.
 */
import { FIELD_H, FIELD_W } from "../layout/tileMetrics";
import { DataChip } from "./DataChip";

export function DataTile({
  label,
  selected,
  lifted,
}: {
  label: string;
  selected?: boolean;
  lifted?: boolean;
}) {
  return (
    <div
      className={`board-node field-piece${selected ? " selected" : ""}`}
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
        color: "var(--ink)",
        boxShadow: lifted ? "0 10px 0 var(--btn-shadow)" : "0 5px 0 var(--btn-shadow)",
        outline: selected ? "3px solid var(--select-ring)" : "none",
        outlineOffset: 4,
        transform: lifted ? "translateY(-3px)" : undefined,
        transition: "transform 140ms ease",
      }}
    >
      <DataChip />
      <div style={{ fontWeight: 800, fontSize: 14, textAlign: "center", lineHeight: 1.15 }}>
        {label || "Data"}
      </div>
    </div>
  );
}
