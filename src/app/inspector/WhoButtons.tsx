/**
 * Who assignment: every Human and Robot in both lanes (NA-03, NA-05, NA-11).
 */
import type { ActorDto } from "../../workflow/types";
import { ActorWhoGrid } from "./ActorWhoGrid";

export function WhoButtons({
  actors,
  value,
  onChange,
  disabled,
}: {
  actors: ActorDto[];
  value: string;
  onChange: (actorId: string) => void;
  disabled?: boolean;
}) {
  return (
    <ActorWhoGrid
      actors={actors}
      selectedId={value}
      onPick={onChange}
      disabled={disabled}
      ariaLabel="Who"
    />
  );
}
