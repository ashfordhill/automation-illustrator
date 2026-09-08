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
- Resolution: Shipped in `feat(improve-08): outline the plus taffy` — ink stroke on the taffy’s long edges (not the round caps).
- Attachments: [outline marks](visual-improvements/2026-09-08-taffy-outline-marks.png) · [no outline](visual-improvements/2026-09-08-taffy-no-outline.png)
