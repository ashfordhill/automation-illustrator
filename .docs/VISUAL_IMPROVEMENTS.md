# Visual improvement log

Append-only history of pictures and GIFs the user sent while reviewing the board. Copies live in [`visual-improvements/`](visual-improvements/). Agents: `.cursor/rules/visual-improvements.mdc`.

Newest last. Issue and resolution stay short. No after-screenshots for gestures.

## Template

```markdown
## YYYY-MM-DD — <short title>

- Issue: <one or two sentences>
- Resolution: Planned for Improvement NN | Shipped in `<commit subject>`
- Attachments: [label](visual-improvements/YYYY-MM-DD-slug.ext)
```

---

## 2026-09-07 — selected-only X

- Issue: Deletion should be an X on the selected tile only — no neighbor pick, no red outline (selection is also for `+`).
- Resolution: Shipped in `feat(improve-02): add merge tile type and tile drag`.
- Attachments: [delete X option B](visual-improvements/2026-09-07-delete-x-option-b.png)

## 2026-09-07 — plus pull, Who card, Data tile, Path-pull tab

- Issue: `+` pull is a green taffy blob; Dana’s role chip is a stretched empty box; Data type sits high in the pill; Path-pull tab is dull blue with a “fart” glyph.
- Resolution: Planned for Improvement 03 (scrim + wedge, packed Who/Data, teal Path-pull + new glyph). Insert-on-Path freeze is Improvement 04.
- Attachments: [plus pull](visual-improvements/2026-09-07-plus-pull.gif) · [Dana Who](visual-improvements/2026-09-07-dana-who-card.png) · [Data tile](visual-improvements/2026-09-07-data-tile.png) · [Path-pull tab](visual-improvements/2026-09-07-path-pull-tab.png)

## 2026-09-07 — Step select jump and view switch

- Issue: Clicking a Step nudges it up; Data stays put. Before/After/Both selected fill is a yellow rectangle that misses the rounded frame, with a cyan hairline the user does not want (chunky / Aseprite-easy, original P-01).
- Resolution: Planned for Improvement 05. Step matches Data (no translate on select). View switch gets a chunky ink frame and a fill that meets the outer radius.
- Attachments: [view switch](visual-improvements/2026-09-07-view-switch-fill.png)

## 2026-09-07 — Who dashed ring, Other, merge clutter, zoom

- Issue: Selected Who uses yellow plus a dashed ring. Other prints “Other” on the tile. Merge/Unmerge still clutters After. Wheel zoom jumps; zoom-in often targets empty paper. BEFORE/AFTER corner chips and inspector Remove text are extra chrome.
- Resolution: Planned for Improvement 06 (Who fill-only, trash icon, Other copy, drop lane chips, hamburger dismiss, finer zoom toward the graph). Merge removal is Improvement 07.
- Attachments: [Who Alice](visual-improvements/2026-09-07-who-alice-selected.png) · [wheel zoom](visual-improvements/2026-09-07-wheel-zoom.gif)

## 2026-09-07 — plus taffy, tabs, Path stroke

- Issue: Wedge `+` pull is worse than the old green taffy (keep the dim scrim). Empty-space release lags. Path-pull glyph still wrong. `+`/Path tabs sit on the tile instead of tucked behind. Delete X lifts on hover. Data preview in the `+` fan is smaller than Step. Double-click Path and inspector Dotted/Solid appear to do nothing.
- Resolution: Planned for Improvement 08 (after merge removal). Do not mix into Improvement 07.
- Attachments: [plus submenu](visual-improvements/2026-09-07-plus-submenu.gif)

## 2026-09-07 — plus and Path tabs sit on the tile

- Issue: Selected-tile `+` and Path tabs overlap the right border on top of the tile instead of hanging behind it like `.docs/menu-tab-plus.png`.
- Resolution: Planned for Improvement 08 (tuck both tabs under the tile face).
- Attachments: [tabs overlap](visual-improvements/2026-09-07-plus-tabs-overlap.png)

## 2026-09-08 — tile tabs, select ring, taffy hole

- Issue: `+` and Path tabs sit in the top-right instead of vertically centered on the right edge. Their icons should be slightly larger (X stays the same). The cyan select outline covers the X and the tabs. Pulled `+` taffy has a concave half-circle bite where it leaves the tile.
- Resolution: Planned for Improvement 09 (center the tabs, larger `+`/Path glyphs, shadow selection instead of a ring, solid taffy join).
- Attachments: [tabs and select](visual-improvements/2026-09-08-tile-tabs-select-x.png) · [taffy hole](visual-improvements/2026-09-08-plus-taffy-hole.png)

## 2026-09-08 — tabs on top, pull from under

- Issue: `+` and Path tabs still sit under the tile border. Pulling them out shows a triangular twist and a hard left edge against the tile.
- Resolution: Shipped in `feat(improve-09): sit plus Path tabs on the tile` (tabs on the right edge like X; taffy/string exit from under the face; ghost stays on top).
- Attachments: [tabs under tile](visual-improvements/2026-09-08-tabs-under-tile.png) · [pull twist](visual-improvements/2026-09-08-plus-path-pull-twist.gif)

## 2026-09-08 — Path-adding tracks

- Issue: Path-pull spindle does not read as “add a Path.” User wants a three-capsule staggered track mark.
- Resolution: Path tab uses a chunky orthogonal fork of rounded capsules (trunk splitting into two Paths), so it reads as “pull a Path” and stays distinct from `+`.
- Attachments: [path tracks motif](visual-improvements/2026-09-08-path-adding-tracks.png)

## 2026-09-08 — Path-adding connect / dotted

- Issue: Fork still feels abstract. User wants a connecting-wires mark (circles or dotted ends, not plugs) or a plain dotted line.
- Resolution: Path tab is a short dotted Path (three round dashes). Plug drawing is too busy at tab size; a row of dots read as an ellipsis.
- Attachments: [connect wires](visual-improvements/2026-09-08-path-connect-wires.png)

## 2026-09-08 — Path dash uneven

- Issue: `stroke-dasharray` on the Path tab is uneven (long dash, then two stubs).
- Resolution: Three equal capsule dashes, drawn as rects.
- Attachments: [uneven dashes](visual-improvements/2026-09-08-path-dash-uneven.png)

## 2026-09-08 — tile-drag Path preview and move cursor

- Issue: While dragging a tile, preview Paths sometimes draw as a big orthogonal box (shared trunk/spine plus stub jogs) instead of following the tile. The blue insert-band on the real ELK route is the good preview. Default tile cursor is a pointer hand; it should be a four-way move icon like Excalidraw.
- Resolution: Shipped in `feat(improve-10): clean insert preview and move cursor`.
- Attachments: [drag preview Paths](visual-improvements/2026-09-08-drag-preview-paths.gif)

## 2026-09-08 — Path delete hit and menu

- Issue: Redundant Paths (either circled Path into Jack) cannot be removed. Path strokes are hard to click.
- Resolution: Shipped in `feat(improve-11): delete redundant Paths from the context menu`.
- Attachments: [path delete hit](visual-improvements/2026-09-08-path-delete-hit.png)

## 2026-09-08 — tile hover chrome

- Issue: X, `+`, and Path only appear after a Tile is selected, so a hover is not enough to act on it.
- Resolution: Shipped in `feat(improve-12): show tile chrome on hover`.
- Attachments: [tile hover chrome](visual-improvements/2026-09-08-tile-hover-chrome.gif)

## 2026-09-08 — taffy ink outline

- Issue: Pulled `+` taffy is a flat green band with no outline, unlike the ink-bordered tiles it joins.
- Resolution: Shipped in `feat(improve-08): outline the plus taffy`, then `feat(improve-08): make plus taffy outline chunky` — 3px `--line` band fully outside the green, like a tile border.
- Attachments: [outline marks](visual-improvements/2026-09-08-taffy-outline-marks.png) · [no outline](visual-improvements/2026-09-08-taffy-no-outline.png)

## 2026-09-08 — Other Task name and icon

- Issue: New Other Steps show only a small circled exclamation and no Name, so the task half is blank.
- Resolution: Shipped Name “Task” on first Other, with a larger clipboard icon instead of the exclamation.
- Attachments: [other blank](visual-improvements/2026-09-08-other-task-blank.jpg)

## 2026-09-08 — child Step defaults to Alice

- Issue: Creating a Step from another Step (or from Data under that Step) assigned the default Alice instead of the parent’s actor.
- Resolution: Child Steps inherit the parent Step’s Who; Data walks to the nearest upstream Step.
- Attachments: [child defaults Alice](visual-improvements/2026-09-08-child-step-defaults-alice.jpg)

## 2026-09-08 — tile create tabs too small

- Issue: The Tile `+` and Path create tabs on a Tile are small and hard to grab.
- Resolution: Shipped in `feat(improve-15): enlarge tile plus and Path tabs` — 44×44 tabs, 24px peek.
- Attachments: [tile create tabs](visual-improvements/2026-09-08-tile-create-tabs.gif)

## 2026-09-08 — insert onto sibling Path

- Issue: Dragging a Tile onto a hovered Path that shares a trunk with the Tile’s current Path (root fan-out) does not insert.
- Resolution: Unique segments after the split are drop targets; only Paths that touch the dragged Tile fade. Shared trunk still does not pick a Path.
- Attachments: [sibling insert](visual-improvements/2026-09-08-insert-sibling-path.gif)


## 2026-09-08 — Step/Data fan too far

- Issue: The Step and Data boxes on the pulled `+` fan sit too far to the right of the tile.
- Resolution: Shipped in `feat(improve-19): pull Step Data fan closer` — shorter arc, no extra outward offset.
- Attachments: n/a

## 2026-09-08 — create tabs too far from tile

- Issue: Selected-tile `+` (Step) and Path (Data-create sibling) tabs sit too far off the right edge; a paper gap shows between the tile and the icons.
- Resolution: Shipped in `feat(improve-22): sit create tabs closer to the tile` — 14px peek, same hang as the X.
- Attachments: [create tabs gap](visual-improvements/2026-09-08-create-tabs-gap.gif)

## 2026-09-08 — Compare cyan outline

- Issue: In Both, a cyan outline boxed the Before pane and not After, so the split looked unfinished. The switch still said Both.
- Resolution: Shipped in `feat(improve-26): compare view without pan outline` — switch says Compare; no pan-target outline on either pane.
- Attachments: [compare blue outline](visual-improvements/2026-09-08-compare-blue-outline.png)

## 2026-09-08 — Data create-mode gaps

- Issue: Pulling `+` from Data leaves paper gaps between the cream fill and the ink border (Step-shaped scrim hole on a rounder Data tile).
- Resolution: Shipped in `feat(improve-29): match Data radius in plus-pull scrim` — overlay holes use the tile’s own screen-scaled radius.
- Attachments: [data create gaps](visual-improvements/2026-09-08-data-create-gaps.gif)

## 2026-09-08 — Manage actors yellow highlight

- Issue: Selected actor cards in Manage actors (and Who) use a mustard fill and yellow name bar that clash with pastel figures on dark chrome.
- Resolution: Selected Who is cream with a chunky ink border, not yellow. Yellow stays on the view switch and Type / fat buttons.
- Attachments: [manage actors yellow highlight](visual-improvements/2026-09-08-manage-actors-yellow-highlight.gif)

## 2026-09-08 — inspector fold chevron hover

- Issue: Hovering the inspector › / ‹ strip fills the whole drawer edge mustard yellow.
- Resolution: Hover is cream + ink, like the other chrome buttons. Not yellow.
- Attachments: [manage actors yellow highlight](visual-improvements/2026-09-08-manage-actors-yellow-highlight.gif)


## 2026-09-08 — drop status bar project name

- Issue: Bottom-left project title is unreliable and not wanted.
- Resolution: Status bar no longer shows the loaded project name. Right Click Delete and version remain.
- Attachments: n/a

## 2026-09-08 — Right Click Delete on the left

- Issue: Right Click Delete sits on the left of the bottom status bar; version is on the right.
- Resolution: Shipped in `feat(improve-30): put Right Click Delete on the right` — toggle and version are a right-side cluster.
- Attachments: [right click delete left](visual-improvements/2026-09-08-right-click-delete-left.gif)

## 2026-09-08 — Present still shows the nav bar

- Issue: Present hides the inspector and tile chrome but leaves the top bar (and status bar) on screen.
- Resolution: Shipped in `feat(improve-31): hide the nav bar in Present` — full-bleed board; Escape exits.
- Attachments: n/a

## 2026-09-09 — branch rows flip when a branch grows

- Issue: Left `+` / `Q` on Roy (top Search) created a parent fork and swapped that whole row with Alice’s bottom branch.
- Resolution: Shipped in `feat(improve-36): keep branch rows when forking`. Left/right `+` still forks; displayed rows stay put.
- Attachments:
  ![branch row flip](.docs/visual-improvements/2026-09-09-branch-row-flip.gif)

## 2026-09-09 — left plus should be a parent

- Issue: Left `+` / `Q` on Roy still forked a second inbound Path (`new → Roy` plus `Read → Roy`) and assigned Alice instead of Roy.
- Resolution: Shipped in `feat(improve-37): insert left spawn as parent`. Left always inserts a parent in the chain and inherits Who from the successor. Forks are right-only.
- Attachments:
  ![left plus should be parent](.docs/visual-improvements/2026-09-09-left-plus-should-be-parent.gif)

## 2026-09-09 — insert into a merge fork

- Issue: Dragging a Data tile onto the T-junction where two Paths merge into a Step does not insert it as the new merge target; both incoming Paths keep going to the Step.
- Resolution: Planned — treat the shared merge (and the dual shared split trunk) as a bundle drop, so one drop retargets every Path in that junction.
- Attachments:
  ![insert into fork](.docs/visual-improvements/2026-09-09-insert-into-fork.gif)

## 2026-09-09 — tile chrome, hints, Type keypad

- Issue: `+` / Path tabs sit on the tile face; X looks off-center; Right-click Delete hint shows while the toggle is off; Data purple is too dark; Type names are clipped; selected Who still has a chunky ink outline; spawn hints are a long single row.
- Resolution: Shipped in `feat(improve-38): polish tile chrome hints and Type` — 40px tabs with 18px peek, centered X, gated hint, lighter Data mark, unclipped Type names, yellow Who, two-line Q/E A/D helpers.
- Attachments:
  ![tile chrome tabs and X](.docs/visual-improvements/2026-09-09-tile-chrome-tabs-x.png)
  ![hints and status](.docs/visual-improvements/2026-09-09-hints-and-status.png)
  ![type picker squished](.docs/visual-improvements/2026-09-09-type-picker-squished.png)


## 2026-09-09 — Humans and Robots split in Manage actors

- Issue: A new Human (Person…) sat after LLM / Script / Agent and shared the Robots’ row.
- Resolution: Shipped in `feat(improve-40): group Humans then Robots on their own row` — Humans wrap first; Robots always start on the next row. Add human / Add robot append to their own kind.
- Attachments:
  ![manage actors human after robots](.docs/visual-improvements/2026-09-09-manage-actors-human-after-robots.png)

## 2026-09-09 — Type keypad whitespace and Other Task

- Issue: Inspector Type keys are oversized squares with empty pad. Other’s clipboard shows writing lines and Name seeds “Task”.
- Resolution: Shipped in `feat(improve-39): pack Type keypad and blank Other` — packed centered keys, blank clipboard, empty Name.
- Attachments:
  ![type keypad whitespace](.docs/visual-improvements/2026-09-09-type-keypad-whitespace.png)

## 2026-09-09 — Who actors off-center

- Issue: Inspector Who keys sit left, with extra rail space on the right of Missy / Person.
- Resolution: Shipped in `feat(improve-41): center Who keys in the inspector` — the Human/Robot cluster is centered; columns still line up.
- Attachments:
  ![who actors off center](.docs/visual-improvements/2026-09-09-who-actors-off-center.png)

## 2026-09-09 — Other Type key still says Other

- Issue: Inspector Type Other is a yellow key with a clipboard and the word Other.
- Resolution: Shipped in `feat(improve-42): hide Other on the Type keypad` — clipboard only; name row kept empty so spacing matches the other keys.
- Attachments:
  ![other type key label](.docs/visual-improvements/2026-09-09-other-type-key-label.png)

## 2026-09-09 — spawn hint compass

- Issue: The Q/E · A/D spawn diagram’s arrows and dividers read as CAD geometry, not the app’s chunky / quiet-sketch language.
- Resolution: Shipped in `feat(improve-43): restyle spawn hint compass` — chunky filled heads, a slightly bowed round-cap shaft, and one tilted tick; the `|` pipes are gone.
- Attachments:
  ![spawn hint arrows](.docs/visual-improvements/2026-09-09-spawn-hint-arrows.png)

## 2026-09-09 — compact Name/Details and Human

- Issue: New Humans spawn as Person plus a random number. Inspector Name and Details each have a caption above the field, which wastes rail space.
- Resolution: Shipped in `feat(improve-44): compact inspector Name and default Human`. Name is Type plus an underline in one box; Details is an empty box; no captions. New Humans are named Human.
- Attachments:
  ![inspector name details compact](.docs/visual-improvements/2026-09-09-inspector-name-details-compact.png)

## 2026-09-09 — inspector Step Type Who labels

- Issue: Step, Type, and Who captions still sit above the keypad and actor keys.
- Resolution: Shipped in `feat(improve-44): drop Step Type Who captions` — those words are gone; the keypad, fields, Who keys, and trash remain.
- Attachments:
  ![inspector step type who labels](.docs/visual-improvements/2026-09-09-inspector-step-type-who-labels.png)

## 2026-09-09 — Delete should keep a parent selected

- Issue: Deleting a Tile clears selection, so Delete cannot walk a row.
- Resolution: Shipped in `feat(improve-45): select parent after deleting a Tile` — after remove, the parent stays selected (last Tile still clears).
- Attachments:
  ![delete selects parent](.docs/visual-improvements/2026-09-09-delete-selects-parent.gif)

## 2026-09-09 — inspector cluster, Scan, tall Other

- Issue: Name/Details were wider than Type and Who, the Name underline felt busy, and Other sat in a ninth small key instead of filling the right.
- Resolution: Shipped in `feat(improve-46): cluster Type Who and Scan` — Scan in the 3×3, tall Other on the right, Name/Details in a rounded well matching Who width, reserved Type prefix, no underline.
- Attachments:
  ![inspector field balance](.docs/visual-improvements/2026-09-09-inspector-field-balance.png)
  ![type other tall](.docs/visual-improvements/2026-09-09-type-other-tall.png)

## 2026-09-09 — spawn compass was wiggly

- Issue: The Q/E · A/D compass shaft bowed and the center tick leaned, so it read as a shaky sketch.
- Resolution: Correction — straight shaft, vertical tick, symmetric heads. Same quiet ink.
- Attachments:
  ![spawn compass wobbly](.docs/visual-improvements/2026-09-09-spawn-compass-wobbly.png)

## 2026-09-09 — spawn hint keys and tick

- Issue: Hotkey boxes are not one size (Q/E taller, minus wider) and the compass tick is a stub.
- Resolution: Uniform 20px-tall keycaps (single-character keys are square); the center tick is a full-height cross.
- Attachments:
  ![spawn hint keys](.docs/visual-improvements/2026-09-09-spawn-hint-keys.png)

## 2026-09-09 — Present as a person-in-a-box button

- Issue: Present was a hamburger item. The presenter glyph should become a top-right button: person overlapping a rounded rect, white figure, complementary light-blue box, no white scribbles on the legs.
- Resolution: Shipped in `feat(improve-48): present icon menu left and Z remove` — Present is a top-right icon (white figure in front of a light-blue slide). Menu moved leftmost. Dark and Actors left the hamburger. Remove default is Z.
- Attachments:
  ![presenter](.docs/visual-improvements/2026-09-09-presenter.svg)
  ![presenter button mock](.docs/visual-improvements/2026-09-09-presenter-edited.svg)

## 2026-09-09 — insert into a merge fork (shipped)

- Issue: Dropping a Tile on the shared merge T did not make it the new merge target; unique segments still insert only one Path.
- Resolution: Shipped in `feat(improve-47): insert on merge and split trunks` — bundle drop on the shared trunk; unique segments stay single-Path insert; incident trunks stay a dead zone.
- Attachments:
  ![insert into fork](.docs/visual-improvements/2026-09-09-insert-into-fork.gif)

## 2026-09-09 — drag-and-drop hotkey tip

- Issue: Dragging a Tile shows a Drop keycap plus Esc Cancel, which reads as a hotkey row for a mouse gesture.
- Resolution: Shipped in `feat(improve-49): hide the tile-drag hint strip` — no chips and no copy while dragging.
- Attachments:
  ![drag drop hotkey tip](.docs/visual-improvements/2026-09-09-drag-drop-hotkey-tip.gif)

## 2026-09-09 — Present icon clip and foot blob

- Issue: The presenter was flush right, so the trailing arm was sliced off, and a white half-circle sat under the feet (knockout cap).
- Resolution: Shifted the figure left onto a slightly narrower slide, clipped the plump hem (the white half-circle under the feet), and added a hanging arm so the trailing side is not a flat cut.
- Attachments:
  ![present icon clip](.docs/visual-improvements/2026-09-09-present-icon-clip.png)

