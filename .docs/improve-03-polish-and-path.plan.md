# Improvement 03 — polish, Path stroke, on-canvas label

Kickoff for a **fresh** agent. Implement **only** this file. Do **not** implement Improvement 04 (insert-on-Path live preview) or Improvement 05 (Step select / view switch).

User pictures for this slice: `.docs/VISUAL_IMPROVEMENTS.md` entry **2026-09-07 — plus pull, Who card, Data tile, Path-pull tab**.

Contract: `.docs/GOAL.md` (including Amendments). Relay: `.docs/BUILD_PLAN.md` Section 4, `.docs/handoff.md`, `.cursor/rules/agent-handoff.mdc`. Start from the latest COMPLETE handoff commit with a **clean** tree.

Suggested commit: `feat(improve-03): polish chrome Path stroke and on-canvas label`.  
Evidence: `.docs/evidence/improve-03-polish/`.

User approved 2026-09-07 (this planning chat). Cite that date on every GOAL amendment.

---

## 1. Problems

1. Stretchy `+` works, but the rest of the board stays equally loud. Need a dim scrim and a **triangular wedge** from the source tile to the Step/Data previews (not the green taffy blob).
2. Selected-tile red X is fully opaque at rest and distracts when the user selected for `+` / Path-pull.
3. Path-pull tab is dull blue; the knot glyph reads as speed-lines + loop (“fart”), not “pull a string out.”
4. Actor Who card (Dana): terracotta role box is flex-stretched; “Mail clerk” sits at the top of empty space. Task column is similarly top-heavy when Details is empty.
5. Data tile: oval + word sit in the upper half because `.data-label` is a fixed 42 px box under the chip.
6. `+` Data preview is a teal rectangle; it should be the same oval as `DataChip`.
7. Double-click Path does nothing useful (P-08 already forbids zoom). User wants it to toggle dotted/solid.
8. Enter on a Path focuses the inspector. User wants Excalidraw-style typing **on the chip**.
9. Step inspector still shows “Path: 1 Path / All Paths” (Split). User wants to pick dotted vs solid themselves, per Path.
10. Remove animation is a squash; user wants a **bubble-pop**. Remove sound should be a rounder pop (SH-04 already names pop for remove).
11. `--data` and default actor fills are greyed-out pastels; they do not match P-01 chunky/playful.

---

## 2. Locked decisions (do not re-open)

- **No new runtime dependency.** Mantine 9, Tabler, `@xyflow/react` 12, Zustand 5, elkjs 0.12.
- **Vocabulary:** Node, Step, Data, Path, condition, stroke (solid = always visited, dotted = choice), Who, Before / After / Both, merge group. Never “Arrow.” Path inspector field stays captioned **label** (existing NA-07/PC-03 amendment). Stroke UI says **Dotted** / **Solid**.
- **Present / Both:** no chrome, no Path-pull, no on-canvas editor, no double-click toggle.
- **`+` click still does nothing.** Pull threshold and drop-on-preview rules are unchanged (Improvement 02). After: Step preview only.
- **Split stays in the document** (`exclusive` / `parallel`). Inspector no longer exposes it. `maybeExclusiveSplit` / `applyConnectStroke` still run when **creating or connecting** a Path so a second outgoing Path can default to dotted. Toggling one Path’s stroke does **not** rewrite siblings and does **not** change stored Split.
- **Per-Path stroke** is the user control: double-click the Path (stroke or chip), and Dotted / Solid in the Path inspector. Existing ToggleDash keybind stays.
- **Enter on Path** starts an overlay editor on the condition chip (or a chip-sized field at the ELK label rect if the Path has no condition yet). Inspector `label` field stays in sync. Do not move keyboard focus into the rail. Escape cancels the overlay and keeps the last committed value (text undo is still per keystroke, WG-13). Click-away commits and closes.
- **Enter on Data** may keep focusing the inspector Label field (NA-08 for Data unchanged) unless you can reuse the same overlay pattern cheaply on the Data tile; do not spend the slice inventing Data-on-canvas typing.
- **Do not run ELK during `+` pull or Path-pull.** Scrim and wedge are CSS/SVG in `TileChrome`.
- **Do not implement insert-on-Path preview** (ghost gap, neighbor easing). That is Improvement 04. Existing insert-on-drop may stay as-is.
- **P-01:** original palette, not Nintendo copies. Use the locked hexes in §4. Contrast: `FIGURE_INK_ON_PASTEL` stays dark on actor fills in both themes; Data oval stays readable on cream.
- **CX-07:** scrim + wedge + stroke toggle are not color-only (wedge shape, dashed vs solid, opacity).
- **AQ-04:** X / `+` / Path tabs already 36–40 px with 24 px gap; do not collapse that spacing. Path tab may change fill; keep size.

---

## 3. GOAL amendments to append (do not edit clauses in place)

Newest last, dated 2026-09-07, “approved by user”:

- **NA-07, PC-02, PC-03** — Step inspector no longer shows Split (“1 Path / All Paths” / One of / Every). Stored `split` remains and still seeds **new** outgoing Paths. The user sets stroke per Path: Dotted or Solid, via double-click, Path inspector, or the existing keybind. Changing one Path does not rewrite the others.
- **NA-08** — Enter on a selected Path opens an on-canvas editor on that Path’s condition chip (Excalidraw-style). The inspector **label** field mirrors the value and is not focused. Enter on Data still focuses the inspector Label unless the same overlay is reused.
- **P-08** — Double-click on a Path toggles dotted/solid. Double-click still does not zoom.
- **CX-06** — Node removal uses a short bubble-pop (scale up then vanish), not a vertical squash. Reduced motion stays immediate.
- **WG-07** — While the `+` tab is pulled past the preview threshold, the board dims behind a scrim; the source tile and previews stay undimmed. A triangular wedge with contrasting fill connects the source tile to the preview cluster. Drop rules unchanged.

---

## 4. Locked colors

Update `HUMAN_PRESETS` / `ROBOT_COLORS` in `src/workflow/actors.ts`, Mailroom demo fills in `src/demos/robotMailroom.ts` (Dana and others that still use washed hexes), `--data` / Path-tab tokens in `tokens.css`. Oak Park Alice/Roy/Jack/Missy pick up presets on next load from the fixture — update `oakParkInvoice.ts` actor colors to the same hexes so evidence matches a first visit.

| Actor / token | New fill (light). Dark theme: keep the same hex on tiles (actor color is document data). |
| --- | --- |
| Alice | `#ff9fbf` |
| Roy | `#7eb6f5` |
| Jack | `#5ed4a4` |
| Missy | `#c89bf5` |
| Dana (Mailroom) | `#f4a06a` |
| Robot LLM | `#5ec4d8` |
| Robot Agent | `#4dceb0` |
| Robot Script | `#6ab0c8` |
| `--data` light | `#1db8a8` |
| `--data` dark | `#3ee0d0` |
| Path-pull tab fill | `color-mix(in srgb, var(--data) 55%, var(--paper-deep))` |
| Path-pull glyph | `#071c28` (black object, both themes) |

If a locked hex fails axe on a specific surface, darken/lighten **that** hex slightly and note it in the handoff. Do not revert to grey-blue.

---

## 5. Work items (do all of these)

### 5.1 `+` scrim + wedge (`TileChrome.tsx`, `tokens.css`)

When plus-pull distance ≥ threshold:

- Full-viewport scrim (`rgba(7, 28, 40, 0.38)` light / `rgba(0,0,0,0.45)` dark), `pointer-events: none` except `.plus-preview`.
- Source tile stays visually above the scrim (raise z-index on that RF node or punch a hole). Previews stay above the scrim.
- Draw an SVG **triangle / trapezoid wedge** from the right edge of the source tile (rest `+` position) to the bounding box of the preview cluster. Fill: cream with a green-tinted edge (`color-mix` of `--plus` and `--cream`), not the old organic taffy path. Stroke `var(--line)`.
- Remove or stop using `taffyPath` for plus-pull. Path-pull keeps its dashed string.
- Reduced motion: skip wedge morph; show scrim + previews immediately.

Evidence: `plus-wedge-1440.png` (Oak Park, `+` pulled, Step + Data visible, board dimmed).

### 5.2 X opacity

`.tile-remove-x` / `.node-remove-x-btn`: opacity ~0.45 at rest; 1 on hover and `:focus-visible`. Keep hover lift. Do not add a red outline on the tile.

### 5.3 Path-pull tab icon + teal

Replace `PathKnotIcon` SVG: black filled knot on the left, a short curved **string** exiting right (one loop + one tail), no parallel “speed lines.” Tab background uses the Path-pull fill in §4. Ghost during pull matches.

Evidence: `path-tab-1440.png` (selected tile, teal tab readable).

### 5.4 Actor + task packing

Root cause: `.actor-chip-role` is `flex: 1 1 auto; min-height: 40px` so leftover Who height becomes empty terracotta. `.task-card-title` is `flex: 1 1 auto` so the title block eats the lower half.

Lock the layout:

- Who: figure on top (unchanged size). Cream name card **hugs content**. Name row `hug`. Role chip: **height follows the type** (even padding ~6–8 px), text centered in that chip. No flex-grow hole. Extra pastel strip may show below the card; that is the actor color, not an empty inner box.
- Apply the same card rules in `MergeWhoColumn`.
- Task column: icon + title (+ detail if any) as a **centered stack** (`justify-content: center`). Title box is not `flex: 1`. If Details is empty, the icon+title group sits in the vertical middle of the cream pane.

Evidence: `dana-card-1440.png` (Mailroom Before, Dana / Mail clerk packed); `data-centered-1440.png` (a Data tile with default “Data” copy).

### 5.5 Data tile + `+` Data preview

- Drop fixed `.data-label { height: 42px }`. Chip + label are one centered column with a small gap.
- `PlusPreview` for Data: render `DataChip` (or the same oval SVG), not `.plus-preview-data` rectangle.

### 5.6 Path stroke UX

- `Board` / `FlowArrow`: double-click Path or condition chip → `toggleSelectedDash` (select the Path first if needed). Ignore if Present/Both or fewer than two outgoing Paths from that source (single outgoing stays solid — PC-02). If the source has 2+ outgoing, toggle **that** Path only.
- Path inspector: keep **label**. Add Dotted / Solid fat buttons (same `FatChoice` pattern). Hidden when the source has only one outgoing Path.
- Remove Step inspector “Path: 1 Path vs All Paths.”
- Update `e2e/inspector.spec.ts` (split group gone; Path Dotted/Solid; Enter focuses canvas chip editor, not `#path-condition-field`). Canvas helper copy: drop “Always visited / Choice” if it still says that; use Dotted / Solid.
- Unit: `store.actors.test.ts` Split rewrite tests — keep graph behavior for `updateNode({ split })` if that API remains, but inspector must not call it. Double-click / inspector stroke uses `updateEdge({ dashed })` / `toggleSelectedDash`.

### 5.7 On-canvas Path label (Enter)

- New small overlay (portal or `EdgeLabelRenderer`) bound to the chip rect: a cream field, chunky border, Nunito, selects existing text on open.
- `focusPathLabel` in the store currently focuses `#path-condition-field`. Point it at this overlay instead (or set interaction `{ kind: "path-label-edit", edgeId }` and let the chip mount the field).
- Typing still `updateEdge` per keystroke (WG-13).
- Escape: `closeBoardModes` / blur overlay; do not steal Delete.
- Evidence: `path-type-on-chip-1440.png` (caret on the chip, inspector label mirrors, inspector input **not** focused).

### 5.8 Bubble-pop + sound

- Replace `.node-squash-inner` with a pop: scale 1 → ~1.12 → 0, opacity 1 → 0, ~180 ms. Keep departing ghost + restitch stretch (CX-06 restitch is not this slice’s rewrite).
- `cues.ts` `pop`: shorter, higher, rounder (e.g. sine 420→180 Hz, ~0.06 s, slightly higher peak). Keep original synthesis, no samples.
- `cues.test.ts` if it snapshots frequencies — update.
- Reduced motion: still skip the pop (immediate removal).

### 5.9 Colors

Apply §4. Recapture Mailroom / Oak Park Who evidence that e2e already writes. Both themes: actor hex is stored, not theme-inverted; Data `--data` has light/dark tokens.

---

## 6. Tests

- `npm run build`, `npm run test:unit`, `npm run test:e2e` (browser flows change).
- Unit: Path double-click / `toggleSelectedDash` still no-ops for a lone outgoing Path; two-outgoing Path toggles only that edge.
- E2E inspector: no “1 Path” / “All Paths”; Path selected → Dotted/Solid; Enter on a labeled Path does not focus `#path-condition-field` (it focuses the canvas editor).
- E2E canvas: `+` pull still shows Step/Data; Data preview has an oval; X is present (opacity is visual).
- Axe: selected tile with chrome still clean (target-size).

---

## 7. Out of scope

- Insert-on-Path live preview (Improvement 04).
- Path `−` / branch deletion.
- Free-form layout, nested unmerge, ELK wrapping, frame around `LaneLayout.bounds`.
- On-canvas typing for Step Name/Details.

---

## 8. Kickoff reminder

If HEAD is not the latest COMPLETE handoff commit, or the tree is dirty, **stop**. If Split vs per-Path stroke seems to contradict PC-02 for **new** Paths, keep create/connect defaults and only change inspector + double-click as specified. Stop and ask only if you would have to rewrite `applyConnectStroke`.
