# Follow-up: merge tile, tile drag, + palette, and Path −

Kickoff document for a later agent. **Do not implement this in Improvement 01.** Improvement 01 (ELK) already re-packs the lane when a Node is added or removed; this work is the interaction and merge-tile layer on top.

Contract: `.docs/GOAL.md` (including Amendments). Relay: `.docs/BUILD_PLAN.md` Section 4, `.docs/handoff.md`, `.cursor/rules/agent-handoff.mdc`. Start from the latest COMPLETE handoff commit with a clean tree.

Suggested commit: `feat(improve-02): add merge tile type and tile drag`. Evidence: `.docs/evidence/improve-02-merge-drag/`.

---

## 1. Problems to solve

### 1.1 Merged tiles distort

Today a merge group is still a `StepNode` that swaps in `MergedStepTile` (`src/board/nodes/StepNode.tsx`). The giant tile reuses `ActorColumn`, which is hard-coded to `STEP_H` (160 px) with `overflow: hidden`. `layoutMergeFlow` / `mergeTileSize` (`src/board/layout/mergeFlow.ts`) set height to `Math.max(STEP_H, flowH + padding)`. When the internal flow is taller than a normal Step, the Robot column does not grow with the tile; when it is shorter, the column still occupies a full Step and the internals look stretched or clipped. MG-08 wants a compact, scroll-free internal flow beside a **normal-size** Robot — that needs its own tile type and layout box, not a Step chrome stretched around a mini graph.

### 1.2 Moving a Step to another Path is delete-and-recreate

There is no way to pick up an existing Step or Data and drop it onto a Path between two tiles. Users who realize a Step belongs elsewhere must remove it and make it again.

### 1.3 Delete is a loud − on every tile

WG-08 currently puts `−` on the NodeToolbar. The desired model: tiles do not show `−`. Removal stays available from Delete / inspector Remove (picker unchanged). `−` appears on a **Path** only when that Path is one of two or more outgoing Paths from its source (deleting a branch, not a lone Path). A single outgoing Path cannot be deleted (NG-03 spirit: the chain stays connected).

### 1.4 `+` is a submenu

WG-07 today: click `+` → menu of Step / Data / Connect existing (After: After-only Step / Connect existing). The desired model is in `.docs/menu-tab-plus.png` and `.docs/menu-tab-plus.svg`: a green `+` tab on the selected tile; dragging the tab out reveals semi-transparent mini previews (Step, Data, and Connect-existing / “arrow to an existing Step or Data”). Dropping the tab on a preview creates that thing. Clicking a preview without a completed drag should still work (keyboard and pointer users).

---

## 2. Locked product decisions (stop and ask if these conflict)

- **No free-form canonical layout** (NG-02). Dragging a tile is a *gesture* (reparent / insert / trash), not a way to park Nodes at arbitrary x/y. ELK still owns displayed positions after the graph mutates. During drag, show a pickup ghost; do not write `position` into the document as the user’s layout.
- **No new UI kit.** Mantine 9 + Tabler + `@xyflow/react` 12. Prefer React Flow node drag / custom pointer capture over adding `@dnd-kit` unless RF cannot do drop targets cleanly; ask before any new runtime dependency.
- **ELK stays the lane engine.** After insert, remove, or reparent, the existing `layoutEngine` pass already contracts empty space (CX-05). Do not hand-place neighbors.
- **Vocabulary:** Node, Step, Data, Path, condition, stroke, Who, Before / After / Both, merge group. Never “Arrow” or “label” for a Path. The Connect-existing preview may be described as “Path to an existing Step or Data”.
- **Present / Both:** no toolbars, no trash, no drag-to-insert. After: no `+ Data`; Connect existing creates an After-only Path (BA-06).
- **Root:** still cannot be removed (WG-06). Root cannot be dragged to trash. Dragging the root onto a Path is rejected.

Amendments the implementing agent must append under `## Amendments` in GOAL.md (user already approved the direction in chat 2026-09-07; cite that date):

- **WG-07** — `+` on a selected Step is a drag-tab plus drop previews (Step, Data, Connect existing). Clicking a preview is equivalent to dropping on it. Empty-canvas click while linking still cancels and never creates an implicit Node.
- **WG-08** — Tile `−` is removed. Delete key and inspector Remove still enter the Node-removal picker. A Path `−` is shown only when the Path’s source has two or more outgoing Paths; confirming it removes that branch Path and reconnects so the graph stays a connected DAG (specify the reconnection rule below — do not guess if ambiguous; stop and ask).
- **NG-03** — Direct deletion of a *lone* Path remains forbidden. Deleting one outgoing Path among two or more is allowed as branch removal, not as “Paths are independent objects”.
- **MG-08** — Merged groups render with a dedicated merge tile type (own React Flow node type, own measured size). The Robot stays normal size; internals do not stretch the Who column.

If WG-08 branch-Path deletion cannot be specified without inventing graph rules, **stop and ask** rather than silently deleting a Node.

Suggested reconnection for “delete this outgoing Path when the source has 2+ outgoing” (confirm with the user if not obvious from the board):

- The Path is removed.
- If the target becomes unreachable, apply the same WG-10..12 restitch used when removing a Node that sat on that branch — **or** only allow the delete when the target still has another incoming Path. Prefer the stricter rule (only allow when the target stays reachable) unless the user says otherwise.

---

## 3. Architecture

### 3.1 Merge tile type

- Add a React Flow node type (e.g. `ReactFlowNodeKind.MergeGroup = "mergeGroup"`) registered next to Step / Data in `src/board/nodes/reactFlowRegistry.ts`.
- Projection already uses `projectedKind: "group"` and `internals`. Map those projected Nodes to the new RF type instead of `StepNode`.
- New presentational component (do not reuse `ActorColumn` at `STEP_H`). Layout:

  ```text
  [ Robot figure, normal size ] [ compact internal flow pane ]
  [ Who name / type chip      ]
  ```

  Height is `max(robot+chips, internals+padding)`. Width is `actorColumn + internals`. Measure this box and pass it into ELK via the existing `TileSizes` map (`Board.tsx` already calls `mergeTileSize`).
- Internals: keep `layoutMergeFlow` as the compact icon+title graph (MG-08), but size the outer chrome from that layout instead of forcing `STEP_H`. Optional later: run a tiny ELK graph for internals; not required if the current mini-flow is cleaned up.
- Handles stay WEST/EAST mid-height so ELK ports still match (`elkGraph.ts` uses `nodeSize` / `TileSizes` and mid-height ports).
- Tests: Mailroom After `g_mail_sort` tile bounding box matches `mergeTileSize`; Robot figure is not clipped; internals are not scaled with CSS `transform` on the whole Step chrome.

### 3.2 Tile pickup (selected only)

- `nodesDraggable` stays false globally. When a tile is selected and the view is editable, enable drag **from a pickup affordance** (the tile body or a small handle — pick one and keep hit targets out of the `+` tab). React Flow `Node.draggable` per node is enough; do not turn on free canvas dragging for unselected Nodes.
- While dragging, show:
  - A ghost of the tile under the pointer.
  - A **trash** control near the selection (top-right of the tile or of the viewport corner of that lane). Visible only while that tile is selected / being dragged. Tabler trash icon, accessible name “Remove Node”. Dropping on it enters the **existing WG-08 picker** (same as Delete), not an instant delete.
- Dropping on empty canvas cancels the pickup; ELK puts the tile back (no document position change).
- After-origin rules: Before-origin Steps cannot be trashed in After (BA-04); merged tile drop-on-trash offers Unmerge.

### 3.3 Drop on a Path to insert

- While a tile is being dragged, each eligible Path shows a drop band on its longest mid segment (the same geometry as `layout.routes[id]` from `LaneLayoutContext`).
- Eligible: dropping tile T onto Path S→U inserts T between S and U:

  1. Reject if T is S or U, if T is the root and this would give the root an incoming Path, if the result would cycle (WG-04), if After/Before overlay rules fail, if a merge group’s convexity would break (MG-10).
  2. Remove T’s current incoming Paths and outgoing Paths using the existing removal/restitch commands so the old neighborhood stays valid (WG-10..12), **in the same undo step** as the insert.
  3. Connect S→T and T→U. Preserve conditions: the original S→U condition moves to S→T (or T→U — pick one rule, document it, unit-test it). Stroke follows PC-02/PC-03 after the source Split is reapplied.
- Data Nodes can be inserted the same way. Merge-group tiles are not insertable as members of another Path in Before; in After, dragging a merged tile is Unmerge-or-reject, not insert-as-group.
- Visual: highlight the Path drop band (CX-07: not color-only). Keyboard equivalent: with a tile selected, an “Insert on Path” flow is optional; if omitted, record it as a follow-up and keep Delete/`+` keyboard paths working (AQ-01).

### 3.4 Path `−` (multi-outgoing only)

- Selecting a Path whose source has `outgoing.length >= 2` shows a small `−` on that Path (Edge toolbar or chip-adjacent control), not on the tile.
- Single outgoing: no Path `−`. Inspector still has no Path delete control for the lone case (NA-12).
- Confirm with the same notice/picker style as other destructive graph edits. One undo step (WG-13).

### 3.5 `+` tab drag onto mini previews

Assets: `.docs/menu-tab-plus.png`, `.docs/menu-tab-plus.svg`.

Behavior:

1. Selected tile shows the green `+` tab on the right (NodeToolbar / custom tab, not a submenu).
2. Pointer down on the tab and drag away: spawn 2–3 semi-transparent mini previews to the right of the tile (Step, Data, Connect existing). After view: Step and Connect existing only.
3. Dropping the tab on a preview runs the current `spawnBranch` / `beginLinkFrom` actions.
4. Click without drag: show the same previews in place (so keyboard and imprecise pointers still work). Escape / empty-canvas click dismisses (CX-08).
5. Previews are not real Nodes; they must not enter ELK. Position them in screen space from the selected tile’s RF box.

Do not keep the old text submenu once the previews exist. Keep the same accessible names so e2e can click “Add Step, Data, or Connect existing” or the preview names.

---

## 4. Implementation order

1. Merge RF node type + chrome that does not use `STEP_H` ActorColumn; Mailroom After screenshot; unit test `mergeTileSize` vs rendered box.
2. Selected-only pickup ghost + trash drop → existing remove picker.
3. Path drop-band insert command (pure function in `workflow/commands.ts`) + store wiring + ELK restyle.
4. Path `−` for 2+ outgoing; GOAL amendments; e2e.
5. `+` tab drag previews using the attached PNG/SVG as the visual reference.

---

## 5. Tests and evidence

- Unit: insert-between, cycle reject, unreachable reject, condition move, After-only Path insert, merge convexity reject, branch-Path delete only when `outs >= 2`.
- E2E: Mailroom merged tile not clipped; drag tile onto Path between two Oak Park tiles; drag to trash opens picker; `+` tab previews; Path `−` hidden on a lone Path and visible on `e_gt`/`e_lt`.
- Evidence 1440×900: merge tile After, insert-between, trash affordance, plus-tab previews, Path minus on a fan-out.

---

## 6. Out of scope

- Enabling `elk.layered.wrapping.strategy` by default (Improvement 01 evidence only).
- Frame/border around `LaneLayout.bounds`.
- Nested or partial unmerge (NG-04).
- Free-form node parking (NG-02).
