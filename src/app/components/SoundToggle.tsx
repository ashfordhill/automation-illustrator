/**
 * Upper-left sound toggle after Undo (P-08, SH-03). Off by default; state is announced.
 */
import { useState } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { IconVolume, IconVolumeOff } from "@tabler/icons-react";
import { useStore } from "../../state/store";

export function SoundToggle() {
  const soundEnabled = useStore((s) => s.soundEnabled);
  const [announcement, setAnnouncement] = useState("");
  const label = soundEnabled ? "Sound on" : "Sound off";

  return (
    <>
      <Tooltip label={`${label} (click to turn ${soundEnabled ? "off" : "on"})`}>
        <ActionIcon
          variant="default"
          aria-label={label}
          aria-pressed={soundEnabled}
          onClick={() => {
            const next = !useStore.getState().soundEnabled;
            useStore.getState().setSoundEnabled(next);
            setAnnouncement(next ? "Sound on" : "Sound off");
          }}
        >
          {soundEnabled ? <IconVolume size={18} /> : <IconVolumeOff size={18} />}
        </ActionIcon>
      </Tooltip>
      <span className="visually-hidden" aria-live="polite">
        {announcement}
      </span>
    </>
  );
}
