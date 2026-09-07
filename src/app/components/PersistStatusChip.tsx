/**
 * Persistent Not saved chip when localStorage cannot be written (SH-11).
 */
import { useStore } from "../../state/store";

export function PersistStatusChip() {
  const persistStatus = useStore((s) => s.persistStatus);
  if (persistStatus !== "unavailable") return null;

  return (
    <span
      className="persist-chip"
      role="status"
      aria-live="polite"
      title="Edits stay in this session until the browser can save them."
    >
      Not saved
    </span>
  );
}
