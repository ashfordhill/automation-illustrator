/**
 * Status-bar sound toggle (left of the version). On by default; state is announced.
 */
import { useState } from "react";
import { Tooltip } from "@mantine/core";
import { IconVolume, IconVolumeOff } from "@tabler/icons-react";
import { useStore } from "../../state/store";

const ICON_SIZE = 14;

export function SoundToggle() {
  const soundEnabled = useStore((s) => s.soundEnabled);
  const [announcement, setAnnouncement] = useState("");
  const label = soundEnabled ? "Sound on" : "Sound off";

  return (
    <span className="status-sound">
      <Tooltip label={`${label} (click to turn ${soundEnabled ? "off" : "on"})`}>
        <button
          type="button"
          className={`status-toggle status-icon${soundEnabled ? " is-on" : ""}`}
          aria-label={label}
          aria-pressed={soundEnabled}
          data-status="sound"
          onClick={() => {
            const next = !useStore.getState().soundEnabled;
            useStore.getState().setSoundEnabled(next);
            setAnnouncement(next ? "Sound on" : "Sound off");
          }}
        >
          {soundEnabled ? <IconVolume size={ICON_SIZE} /> : <IconVolumeOff size={ICON_SIZE} />}
        </button>
      </Tooltip>
      <span className="visually-hidden" aria-live="polite">
        {announcement}
      </span>
    </span>
  );
}
