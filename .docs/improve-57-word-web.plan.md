# Improvement 57 — Simplify as a real word-web view

Kickoff for a **fresh** agent **after Improvement 56 correction 2 is COMPLETE**. Implement **only** this file. Do **not** reopen inspector caps, tile typography, Arrow paths, or unrelated chrome.

Starting commit: `4c8b4596c0e5ce00967d65fb91c7cd8cd1e3d064` (`feat(improve-56): spread word-web ovals`). Clean tree. Protocol: `.docs/BUILD_PLAN.md` Section 4, `.docs/handoff.md`, `.cursor/rules/agent-handoff.mdc`.

Suggested commit: `feat(improve-57): lay out Simplify as a word-web`.  
Evidence: `.docs/evidence/improve-57-word-web/`.

User asked for this plan on 2026-09-10 after reviewing the overlay/spread attempt. Cite that date on GOAL amendments.

---

## 1. Evaluation (why 56 still looks bad)

The attached still is the **tile** graph the user is testing (Chrome gave a JPEG, not an animated GIF). Same board as `.docs/visual-improvements/2026-09-10-simplify-ovals-too-small.png` after Simplify.

What is on the board:

- Four Steps, lots of empty pane: a long Other (`dfsadfasd…`), two empty Others, one Review.
- Dotted choice Paths (One of).
- Simplify is off. The empty canvas is the space they want the word-web to use.

What 56 actually does today:

1. RF nodes stay `STEP_W`×`STEP_H` / `FIELD_*` (`256×160`). Ovals are a **screen-pixel overlay** (`measureSimplifyOval` → `width = screen / zoom`) centered on those boxes.
2. Paths still attach to the **invisible tile handles**, so strokes dive through the middle of pills instead of meeting their rims.
3. `spreadLaneLayout` multiplies ELK coordinates by **2.5** about the centroid. It does not know oval sizes. Neighbors still overlap (40px screen type on ~378px of screen gap at overview) or the island stays small (close zoom, few nodes).
4. The **camera is the tile camera**. There is no fit to the word-web. Small boards stay a clump in a sea of dots; large boards overflow and collide.
5. Enter/leave is a snap. It does not read as a second view.

This is not a sizing-constant problem. Screen-fixed type + tile-sized layout + uniform scale + no camera fit cannot be “big ovals,” “no overlap,” “use the pane,” and “a large workflow readable without panning” at the same time. Correction 1 and 2 both kept ELK tile positions; that lock is **withdrawn**.

---

## 2. Outcome

When Hide visuals (or latched zoom-out — §3) is on, the lane is a **word-web**:

- Each visible Step/Data is a cream ink oval whose box **is** the RF node (handles on the rim).
- Copy is the first line of Type + Name (empty Other is `?`). Details stay off the oval.
- Paths are real ELK orthogonal routes between those oval-sized nodes, with **long** between-layer gaps so pills do not touch.
- The camera **fits the word-web** so this four-Step board fills the pane with large ovals, and Oak Park’s full graph stays on screen (text scales down together).
- Leaving Simplify restores the tile ELK layout and the **previous tile camera**.
- Document, undo, and YAML are unchanged.

---

## 3. Locked decisions (do not re-open)

- **No new runtime dependency.** Same ELK worker. No second layout engine.
- **No document write.** Oval positions are derived, same as tile ELK (CX-05). No schema bump.
- **Design-space ovals, then fit.** Measure ovals in **flow pixels at zoom 1** (font 40 Step / 28 Data, max width 640, `?` min ~168). Those numbers **are** the ELK node `width`/`height`. Then `fitView` the lane (existing first-layout padding). A small graph zooms in (big pills). A large graph zooms out (smaller pills, all visible, no pile). Do **not** inverse-scale type with `1/zoom`. Do **not** post-scale a tile layout (`spreadLaneLayout` is deleted).
- **RF node size = oval size** while simplified. `tileSizes[id]` feeds `useLaneLayout`. Ports stay WEST/EAST at mid-height of **that** box.
- **Word-web ELK options** (override `ROOT_OPTIONS` only while simplified): keep layered / RIGHT / ORTHOGONAL / BALANCED. Raise air: `elk.layered.spacing.nodeNodeBetweenLayers` ≥ **160** (tile `TILE_GAP` is 64); `elk.spacing.nodeNode` ≥ **80**. Omit condition-chip label boxes (`{}`) so gutters do not reserve chip space. Chips stay hidden while simplified (already).
- **Hide data** still omits Data nodes and skip-hops (`hopEdges`). The word-web ELK graph is the **hopped** Step graph when Hide data is on (do not lay out hidden Data, then hop). 1:1 Step Paths stay selectable; collapsed hops stay display-only.
- **Arrow paths stays gone.**
- **Camera:** on enter, store the current viewport, then fit the word-web (both lanes share the camera — BA-05). On leave, restore the stored viewport. Reduced motion snaps; otherwise use the existing modest layout interpolation if the jump is within `MODEST_MAX_PX`, else snap (do not invent a new tween).
- **Hide visuals on zoom-out vs always:** both enter the **same** word-web. Zoom-out is a **latch**: when tile-camera zoom crosses below `SIMPLIFY_ZOOM_ENTER`, turn the web on. **Do not auto-leave** just because `fitView` raised zoom above `SIMPLIFY_ZOOM_LEAVE` (that oscillates on this four-Step board). Leave zoom-out mode only when (a) the user unchecks it / Hide visuals, or (b) they **wheel/pinch zoom in** from the fitted web past `SIMPLIFY_ZOOM_LEAVE`. Programmatic fit does not count as user zoom.
- **Menu dismiss** from 56 correction 2 stays.
- **Present / Compare** keep the web if prefs say so. Present still hides the status bar.
- **Do not** pack a force-directed “mind map,” do not change tile ELK for the normal view, do not cap Step Name in this improvement (the overflowing Other on the still is out of scope).

---

## 4. GOAL amendments to append (do not edit clauses in place)

Newest last, dated 2026-09-10, “approved by user”:

- **P-05, CX-02, CX-03, CX-05, NA-10** — While Simplify Hide visuals is on, the lane uses a second derived ELK pass whose node sizes are the word-web ovals (Type + Name; empty Other is “?”). Paths route to oval ports with wider gutters. The camera fits that layout on enter and restores the tile camera on leave. The document is unchanged. Overlay-on-tile-boxes and uniform position scale are withdrawn. Hide visuals on zoom-out latches the same view and does not drop it when the fitted zoom is high.

---

## 5. Wiring

Delete or stop calling:

- `src/board/simplify/spreadLayout.ts` (and its test).
- Screen/`1/zoom` oval host in `SimplifiedTile.tsx` — the oval should **fill the RF node** (`width/height: 100%`), not overflow a 256×160 hole.

Keep / extend:

- `src/board/simplify/headline.ts` — keep `simplifyHeadline` / `?`. Change `measureSimplifyOval` to return **flow** size at the design font (ignore zoom, or only accept it for tests). Update unit tests: no “wider than `256 * zoom`”; assert oval ≥ tile at zoom 1 and `?` has a real min box.
- `src/board/Board.tsx`
  - When `simplified`, build `tileSizes` from `measureSimplifyOval(simplifyHeadline(node))` for each **visible** projected node (skip Data if Hide data).
  - Pass hopped projection into `useLaneLayout` when Hide data (or filter Data out of the layout projection and keep hop edges on the RF side — pick one; layout must not reserve Data slots).
  - Pass word-web spacing into the layout engine (extend `buildElkGraph` / `layoutEngine.keyFor` with a `mode: "tile" | "web"` or a spacing bag so the cache key changes).
  - Fit / restore camera on `simplified` edge (not on every zoom tick). After-lane follows Before (BA-05).
  - Latch: do not call `isSimplified(..., wasSimplified)` in a way that drops the web because fit changed zoom. Track `userZoomed` vs programmatic fit.
- `src/board/layout/elkGraph.ts` (or a thin `webRootOptions()`) — wider spacing; no chip labels in web mode.
- `src/board/layout/useLaneLayout.ts` / `layoutEngine` — key must include web mode + oval sizes.
- `src/app/styles/tokens.css` — `.simplified-oval` fills the node; overflow visible only for the lift shadow, not a second coordinate system.
- Status bar / prefs types stay (no Arrow paths).

Suggested helpers (framework-free, unit-tested):

```ts
export function wordWebNodeSize(node: NodeDto): { w: number; h: number };
export function wordWebRootOptions(): Record<string, string>;
/** true if this zoom change should leave zoom-out latch */
export function simplifyZoomOutShouldLeave(opts: {
  prefs: SimplifyPrefs;
  zoom: number;
  fittedZoom: number;
  userAdjustedZoom: boolean;
}): boolean;
```

---

## 6. Tests

- `npm run build`, `npm run test:unit`, `npm run test:e2e` for `e2e/improve-56-simplify.spec.ts` (rewrite assertions) plus a new `e2e/improve-57-word-web.spec.ts` if cleaner.
- Unit: oval measure independent of zoom; `?` min size; two-node chain word-web layout — center distance ≥ `ovalW + 160 - epsilon`; hop graph has no Data nodes when Hide data; latch does not leave on programmatic zoom 1.2.
- E2E (1440×900 and 1024×768):
  - Oak Park + Hide visuals: every Step headline readable (`Read invoice.pdf` not `Rea…`); ovals do not overlap (bounding boxes); Paths exist; chips hidden; Simplify yellow.
  - Hide data: no Data ovals; hop lines; Write still visible.
  - Click board closes the submenu (keep).
  - Present keeps the web; no status bar.
  - Leave Hide visuals: tiles and prior camera return (Oak Park still fit-ish, actors visible).

Evidence (1440×900 unless noted):

- `web-small-board-1440.png` — Hide visuals on a 3–4 Step board like the still: large ovals, long Paths, pane used, no pile.
- `web-oak-park-1440.png` — Oak Park full web on screen, headlines complete.
- `web-hide-data-1440.png` — hops, no Data pills.
- `web-leave-tiles-1440.png` — after unchecking, tiles + Who back.
- `web-1024.png` — min width.

Do **not** let Playwright rewrite older `.docs/evidence/improve-21-*` / `improve-30-*` PNGs (restore if it does).

---

## 7. Out of scope

- 24-character Name/Details cap, tile caption reflow (visible on the still’s overflowing Other).
- Force-directed / radial mind-map.
- Reintroducing Arrow paths.
- Changing tile ELK for the normal view.
- New runtime deps.

---

## 8. Kickoff reminder

If HEAD is not `4c8b459` / `feat(improve-56): spread word-web ovals`, or the tree is dirty, **stop**. If word-web ELK and tile ELK fight (flash, wrong cache), fix the layout **key** (mode + sizes) before touching the camera. If zoom-out flickers tiles ↔ web, the latch is wrong — programmatic fit must not clear `simplified`.
