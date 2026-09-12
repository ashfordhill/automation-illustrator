/**
 * Word-web oval for Simplify. The RF node box is the oval (ELK ports on the rim).
 */
import { simplifyScreenFontPx } from "../simplify/headline";

export function SimplifiedTile({
  text,
  kind,
  selected,
  lifted,
}: {
  text: string;
  kind: "step" | "data";
  selected?: boolean;
  lifted?: boolean;
}) {
  const font = simplifyScreenFontPx(1, kind);
  return (
    <div className="simplified-tile-host" data-simplified-tile={kind}>
      <div
        className={`simplified-oval${selected ? " selected" : ""}${lifted ? " is-lifted" : ""}`}
        title={text}
        aria-label={text}
        style={{ fontSize: font }}
      >
        <span className="simplified-oval-text">{text}</span>
      </div>
    </div>
  );
}
