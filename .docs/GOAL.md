# Automation Pitch — Frozen Goal

Frozen contract for the build relay. The clause groups below are mirrored verbatim from Section 2 of `.docs/BUILD_PLAN.md` (generated 2026-09-06). Implementing agents never edit clauses. When the user decides a change, append it under **Amendments** with the date, the clause IDs affected, and the new wording; the original clause text stays in place. Handoff entries cite clause IDs.

### Product (P)

- **P-01** Automation Pitch is a responsive, self-explaining desktop workflow board for comparing a human-heavy Before process with a more automated After process. It uses an original chunky, playful visual and audio language; it does not copy Nintendo assets, sounds, typefaces, marks, or game interfaces.
- **P-02** A first-time user can create, label, connect, remove, compare, merge, unmerge, save, and load without hidden graph knowledge.
- **P-03** Interactions remain smooth with about 30 total Nodes and Paths on supported screens.
- **P-04** The supported viewport is desktop/laptop at least 1024 CSS pixels wide. Smaller viewports show a clear unsupported-view message instead of a broken board.
- **P-05** The approved top bar, right inspector, and hamburger placement remain. No new permanent panel is introduced except the small After merge dock. The right inspector may widen to at most 320 px; no other approved surface moves.
- **P-06** The generic idle helper chips disappear. Contextual hints appear only while a selection or active task needs guidance.
- **P-07** Present mode remains as the first hamburger item. Present hides the inspector, NodeToolbars, merge dock, and contextual hints; disables all editing; shows the automation score in the top bar; Space toggles Before/After. Exiting Present restores the previous view and selection state.
- **P-08** The Pointer/Hand tool toggle is removed. Panning is drag on empty canvas, scroll/pinch zoom, and the pan keys. The upper-left group becomes Undo and the sound toggle.
- **P-09** Light and dark themes remain (hamburger toggle). Every new or restyled surface is legible and passes contrast in both.
- **P-10** Mantine 9 and Tabler icons remain the only UI kit and icon set.

### Workflow graph (WG)

- **WG-01** A brand-new board contains zero Nodes and the default actor roster (Alice, Roy, Jack, Missy, Robot). Its obvious empty-state action is **Add Step**, which creates the root assigned to the default Human.
- **WG-02** The first Step becomes the sole root. Every nonempty document has exactly one root. The root has no incoming Paths; a connection into the root is rejected.
- **WG-03** The workflow is a connected directed acyclic graph. Every Node is reachable from the root; reconvergence and multiple incoming Paths are allowed.
- **WG-04** A proposed connection that would create a cycle, duplicate an existing Path, or violate the root/reachability rules is rejected before mutation with a concise visible explanation.
- **WG-05** Paths are editable relationships, not independently removable objects. Selecting a Path and pressing Delete explains that the user must remove a Node and that the workflow will be reconnected. Backspace is not a removal key; it remains Undo.
- **WG-06** The root Node cannot be removed. The UI explains why and recommends New for a clean board.
- **WG-07** `+` opens Step, Data, and Connect existing. Clicking empty canvas while linking cancels the link; it never creates an implicit Node.
- **WG-08** `−`, the Delete key, and the inspector Remove button enter the same Node-removal picker. The current Node and its directly connected Nodes are valid candidates subject to graph rules. Removal always requires an explicit confirmation (Enter or click) inside the picker.
- **WG-09** For every entry point the first outgoing child is preselected; a leaf defaults to itself. Keyboard focus and a strong but tasteful visual highlight follow that default. Up/Down move between candidates; Escape cancels.
- **WG-10** Removing a Node never leaves an unreachable Node. One predecessor with one successor reconnects automatically. One predecessor with many successors, or many predecessors with one successor, reconnects automatically as a full fan.
- **WG-11** If the removed Node has two or more predecessors and two or more successors, the UI previews deterministic nearest visual pairings (vertical distance, then horizontal, then ID). The user may adjust pairings; a pairing set is valid only if every successor keeps at least one incoming Path. Confirmation applies that exact plan atomically.
- **WG-12** When two removed-adjacent Paths collapse into one, trimmed nonempty conditions are preserved in traversal order and joined with ` + `. Empty values do not produce stray separators. If the collapsed Path would duplicate an existing Path, the existing Path is kept and the conditions are joined into it by the same rule.
- **WG-13** A structural create, connect, remove, merge, or unmerge is one undo step. Text remains one undo step per committed keystroke, as explicitly chosen. History holds 500 entries. Undo and redo never change the active view.

### Paths, conditions, and strokes (PC)

- **PC-01** A Path's stroke carries meaning: **solid** means the Path is always visited; **dotted** means the Path is a choice (one of several).
- **PC-02** A Step's Split sets the default stroke of its outgoing Paths: **One of** (stored `exclusive`) makes every outgoing Path dotted; **Every** (stored `parallel`) makes every outgoing Path solid. A Step with a single outgoing Path draws it solid regardless.
- **PC-03** A Path may override its stroke individually (Always visited / Choice) so one Step can mix an always-visited Path with a set of choices. Changing the Step's Split re-applies the default to every outgoing Path.
- **PC-04** A collapsed Path (WG-12) is dotted if any Path it replaces was dotted; otherwise solid.
- **PC-05** Stroke and Split survive migration, projection (merged internals and projected boundary Paths included), and Smart Edge rendering.
- **PC-06** Demo fixtures follow PC-01: both Oak Park amount conditions are choices and therefore dotted.

### Nodes, actors, text, and inspector (NA)

- **NA-01** Human actors have editable Name, Color, and Role. Robot actors have editable Name, Color, and Type (LLM / Agent / Script).
- **NA-02** Actors may be deleted only when unused in either lane, including After-only Steps. A blocked deletion identifies the assigning Steps.
- **NA-03** Robots may be assigned in Before (an existing workflow may already be partly automated). New Before-origin Steps default to the last-used Human, else Alice, else the first Human, in both lanes, so a new Step is not automated until its After Who changes. After-only Steps default to the default Robot.
- **NA-04** The default Robot is the first Robot on the roster. If no Robot exists when After needs one (merge or After-only Step), a Robot named "Robot" of Type Script is created automatically inside the same undo step.
- **NA-05** Step Type uses alphabetical fat buttons with Other last. Who uses accessible Human/Robot actor icon buttons; every actor is offered in both lanes.
- **NA-06** Who assigns on primary click. A compact Manage actors action edits, adds, and deletes actors in the same right inspector; the removed inventory rail is not recreated.
- **NA-07** The inspector calls an edge **Path / condition**, never Arrow/label. The stroke control reads "Always visited (solid) / Choice (dotted)"; the Step control reads "Split: One of / Every".
- **NA-08** Enter on a selected Path or Data Node focuses its primary naming field and selects the current value. Enter on a Step does not guess among fields.
- **NA-09** Native Tab and Shift+Tab order remains complete and logical across visible controls; closed/inert controls are skipped.
- **NA-10** Actor name/role, Data label, Step title, and Step detail wrap and shrink only to a readable minimum, then clamp with ellipsis and expose the full value accessibly.
- **NA-11** The old actor paintbrush assignment mode (select an actor, then click Steps) is removed; Who buttons are the single assignment interaction.
- **NA-12** The inspector has no Path delete control. Its Node Remove button enters the WG-08 picker.

### Canvas experience (CX)

- **CX-01** Tile-local controls use React Flow `NodeToolbar` so hit targets are not covered by drag surfaces.
- **CX-02** Condition labels remain clickable at all zoom levels and do not accidentally trigger edge selection.
- **CX-03** Path routing avoids Node rectangles and reduces collisions through `@tisoap/react-flow-smart-edge` v5, preserving the approved orthogonal/stepped look and dotted strokes.
- **CX-04** Label placement is a custom deterministic stage after routing: choose the clearest segment, avoid Nodes and previously placed labels, then wrap/clamp within an explicit maximum width.
- **CX-05** Label-aware spacing is derived for each rendered lane and excluded from the saved document and undo history. Long labels may expand the lane; shortening them contracts it smoothly back toward canonical positions.
- **CX-06** Node removal has a quick squash/pop animation and a connector-stretch restitch animation. `prefers-reduced-motion` receives an immediate, non-flashing equivalent.
- **CX-07** Selection, hover, focus, keyboard focus, removal candidacy, and proposed restitches are distinguishable without relying on color alone.
- **CX-08** Empty-canvas click cancels any transient canvas interaction and clears selection. Escape always returns to idle.

### Before, After, and Both (BA)

- **BA-01** Workflow document version 2 stores one shared base workflow plus an After overlay containing After assignments, merge groups, After-only Steps, and After-only Paths.
- **BA-02** Before-origin field values (Step Type, title, detail, Data label, conditions, strokes, Split, positions) are shared. Editing one from Before or After updates the same base value, reflected immediately in both views and inside merged internals. Who is lane-specific by design and is the only per-lane value on a Before-origin Step.
- **BA-03** Before is the only view that may remove a Before-origin non-root Node.
- **BA-04** After may not remove Before-origin Steps; it represents them individually or in merge groups. `−`/Delete on a Before-origin Step in After explains this; on a merged tile it offers Unmerge.
- **BA-05** Both is read-only comparison: no NodeToolbars, no merge dock, no inspector editing. Before and After have independent pan/zoom viewports. Pan keys act on the lane that last received pointer or keyboard focus.
- **BA-06** In After, `+` offers After-only Step and Connect existing; `+ Data` is not offered. Connect existing in After creates an After-only Path, which may join any two Nodes visible in After (base or After-only), subject to WG-04 evaluated on the After projection. After-only Paths never appear in Before.
- **BA-07** After-only Steps default to the default Robot, exist only in After, are never merge members, and may be removed in After through the same picker; reconnection applies the WG-10..12 rules to After-only Paths on the After projection.
- **BA-08** After-only Steps are omitted entirely from the automation score. The score counts Before-origin Steps whose Before actor is not a Robot and whose After actor is a Robot, counting merged members individually rather than one giant tile.
- **BA-09** Removing a Before-origin Node also removes After-only Paths touching it and reconnects on the After projection by the same fan rules so no After-only Step becomes unreachable; merge groups are pruned per MG-10.

### Merge groups (MG)

- **MG-01** The merge dock appears only in editable After view. It uses Merge and Unmerge buttons with compact guidance.
- **MG-02** A group contains one or more Before-origin Steps. Data Nodes and After-only Steps cannot be selected as members.
- **MG-03** A selection expands to its closure: every Node on a base path between two selected Steps is included, Steps as members and Data Nodes as supporting internals. The expanded group is previewed before confirmation.
- **MG-04** A group must be convex: no base path may leave the group and re-enter it. Closure expansion makes any connected selection convex. A selection whose Steps are not connected by base paths is rejected with an explanation.
- **MG-05** Selecting a Step already in a group plus additional Steps extends that group; selecting members from multiple groups flattens them into one group. Nested groups are never created.
- **MG-06** A merge group uses the default Robot. Choosing another Who for the giant Step updates every swallowed Step.
- **MG-07** Unmerge restores the entire group; partial unmerge is not supported. Member robot assignments remain after unmerge.
- **MG-08** A merged tile displays a compact, scroll-free internal flow using icon plus title/target, condition branching, and strokes, without System/detail text. The Robot figure stays normal size.
- **MG-09** External Paths are projected through the merged tile without rewriting the base graph. Conditions remain attached to their underlying Paths. Distinct parallel boundary Paths keep their own conditions.
- **MG-10** A Before connection that would break an existing group's convexity is rejected with an explanation naming the group (unmerge first). A residual group left noncontiguous by a Before removal dissolves with a notice. A group dissolves when no member remains.

### Shell, demos, sound, and data safety (SH)

- **SH-01** The shell becomes more contrast-rich and chunky without moving approved controls or adding decorative UI, in both themes.
- **SH-02** Before/After/Both is visually prominent, keyboard accessible, and keeps the existing Before/After/Both information architecture.
- **SH-03** Sound is a new feature, off by default. The upper-left sound toggle (after Undo) turns locally synthesized UI feedback on or off, persists the preference, and has a visible and announced state.
- **SH-04** Cues are original Web Audio synthesis at a fixed low volume, never copied samples: soft blip for create/connect, pop for remove, low buzz for a rejected action, two-note for merge/unmerge, tick when sound is turned on. Reduced-motion users may still use sound; sound remains independently controllable.
- **SH-05** The hamburger keeps Present, New, Import, Keybinds, and Light/Dark mode in place. Demo becomes a chooser (Oak Park Invoice, Robot Mailroom) and moves to the bottom. No Export item is added.
- **SH-06** New, Demo, and Import share a Save copy / Discard / Cancel gate before replacing the current document.
- **SH-07** The two demos are Oak Park Invoice and Robot Mailroom (Appendix A). Robot Mailroom is a compact showcase with a preconfigured merge and an After-only Robot Step. Demo IDs are deterministic; user-created IDs are collision-safe.
- **SH-08** Saved and imported JSON is validated at runtime with Zod 4. Valid version 1 data migrates deterministically to version 2.
- **SH-09** A version 1 document whose graph violates WG-02..WG-04 (multiple roots, unreachable Nodes, cycles) is not repaired. It is rejected into recovery with a list of the specific violations.
- **SH-10** If saved browser data cannot migrate, its raw value is preserved under its original key and never overwritten. The user sees Download recovery copy and Start fresh.
- **SH-11** If localStorage fails, editing continues in memory and one persistent unobtrusive Not saved warning appears until a successful save.
- **SH-12** Successful New, Demo, and Import clear undo/redo history so Undo cannot cross document boundaries.
- **SH-13** The duplicate `export-json` CLI and its README instructions are removed; Save copy is the supported JSON download.
- **SH-14** The existing rebindable Keybinds catalog remains the single source for single-key actions and the Keybinds modal. Backspace stays Undo. Pointer/Hand actions are retired; detach becomes Remove Node (`-`), path-confirm becomes Confirm (Enter); Merge (`m`) and Unmerge (`u`) are added. Saved keymaps ignore unknown or retired actions.
- **SH-15** Nunito is bundled locally and the Google Fonts link is removed.

### Accessibility and quality (AQ)

- **AQ-01** All pointer actions used outside the hamburger have keyboard equivalents registered in the Keybinds catalog or native focus order.
- **AQ-02** Semantic names describe actions truthfully; icon-only controls have visible tooltips and accessible labels.
- **AQ-03** Focus is restored predictably after menus, dialogs, linking, removal, merge, and recovery actions.
- **AQ-04** WCAG 2.2 AA is the target. Playwright plus `@axe-core/playwright` covers critical states; manually reviewed keyboard and contrast checks remain required.
- **AQ-05** Motion honors `prefers-reduced-motion`; any blinking edge behavior becomes static emphasis in that mode.
- **AQ-06** Critical graph, schema, migration, projection, condition-join, stroke, merge-closure, and recovery rules have Vitest coverage.
- **AQ-07** Critical create/connect/remove/replace/compare/merge flows have Playwright Chromium coverage and reviewed screenshots.

### Explicit non-goals (NG)

- **NG-01** No mobile/tablet authoring UI.
- **NG-02** No free-form draggable canonical layout or multi-root forests.
- **NG-03** No direct Path deletion.
- **NG-04** No nested or partial merge groups.
- **NG-05** No After-specific copies of shared Before fields (Who is lane-specific, not a copy).
- **NG-06** No merging of After-only Steps.
- **NG-07** No Export menu item or command-line exporter.
- **NG-08** No new UI kit, permanent left palette, actor inventory, redo button, minimap, background grid, speculative dashboard, or Pointer/Hand tool.
- **NG-09** No automatic repair of invalid version 1 graphs.

## Amendments

Append only, newest last. Format: `- YYYY-MM-DD — <clause IDs> — <decision and new wording> — approved by user`.

- 2026-09-07 — CX-03 — Path routing is computed by the Eclipse Layout Kernel (elkjs, layered algorithm, orthogonal edge routing) in the same pass as Node layout. Paths leaving one Node share one trunk and split at right angles; Paths entering one Node merge the same way; no Path crosses a Node. @tisoap/react-flow-smart-edge is retired. The orthogonal/stepped look and dotted strokes are unchanged. — approved by user
- 2026-09-07 — CX-04 — Condition chips are placed by ELK as inline center edge labels sized from the wrapped and clamped chip box (LABEL_MAX_WIDTH, LABEL_MAX_LINES). The layout reserves gutter space for every chip, so chips never cover Nodes or each other. Chips remain independent hit targets (CX-02). — approved by user
- 2026-09-07 — CX-05 — The derived lane layout computes every displayed Node position, Path route, and chip position from the lane projection with ELK. Saved Node positions remain in the document as creation hints only and stay excluded from save and undo semantics. Layout is deterministic for a given projection; shortening a condition contracts the lane. — approved by user
- 2026-09-07 — WG-09, WG-11 — "First outgoing child" and "nearest visual pairings" are evaluated on the displayed (derived) positions of the active lane, falling back to saved positions when no layout exists yet. — approved by user
- 2026-09-07 — PC-01, PC-03 — Where an always-visited (solid) Path shares a trunk with choice (dotted) Paths out of one Node, the trunk renders solid (solid Paths draw above dotted); each Path keeps its own stroke after the split. — approved by user
- 2026-09-07 — NA-05 — The inspector Type picker offers Call, Copy, Email, Print, Read, Review, Search, Write, and Other last. Scan, Drag, Approve, and File remain valid stored values and appear in the picker only when the selected Step already has that Type. — approved by user
- 2026-09-07 — NA-07 — The Step control that was "Split: One of / Every" is now "Path: 1 Path / All Paths" (stored values exclusive/parallel unchanged). It is shown only when the Step has two or more outgoing Paths. The Step naming fields are "Name" (was Target) and "Details" (was System / detail). — approved by user
- 2026-09-07 — P-06 — The idle inspector copy "Select a tile or Path to edit" is removed. Contextual canvas hints remain selection- or task-only and use a quiet Excalidraw-style keycap treatment. — approved by user
- 2026-09-07 — CX-01 — Tile-local +/− NodeToolbars appear only while that tile is selected (or its add menu is open), not on hover. — approved by user
- 2026-09-07 — P-08 — Selecting a Node or Path does not pan or zoom the board. Double-click does not zoom. Zoom is user-driven (scroll and pinch) across a continuous range from 0.2 to 2.5. One-time fitView on the first layout of a lane with no stored viewport is unchanged. — approved by user
- 2026-09-07 — BA-05 — In Both, Before and After share one pan/zoom camera as a best-effort comparison (same viewport transform; After may include extra Steps or merge tiles). Pan keys move both lanes. Independent cameras remain in Before-only and After-only. — approved by user
- 2026-09-07 — WG-08, WG-09, NA-12 — −, Delete, and inspector Remove still enter Node-removal pick on the current Node and its directly connected Nodes (graph rules unchanged). Candidates are highlighted on the board with a red X; clicking that X or pressing Enter removes the highlighted candidate. Many-to-many still opens the pairing preview before apply. The bottom “Remove which Node?” dialog is gone. Escape cancels. — approved by user
- 2026-09-07 — NA-07, PC-03 — The Path inspector is a single text field captioned **label**. The “Path / condition” heading and Always visited / Choice controls are not shown. Per-Path stroke still lives in the document, follows Split defaults (PC-02), and can be toggled with the existing keybind. — approved by user
- 2026-09-07 — WG-07, CX-01 — Selected-tile `+` is a stretchy tab: click does nothing; drag past a short pull fans Step / Data mini previews (After: Step only). Drop on a preview creates it; release elsewhere snaps back. `1` / `2` on a selected tile spawn Step / Data immediately. — approved by user
- 2026-09-07 — WG-07, AQ-01 — A second selected-tile tab (knot / hook) pulls a Path onto another Node. Release on a valid tile connects; miss snaps back. Path has no hotkey (the target must be pointed at). Empty-canvas release never creates an implicit Node. — approved by user
- 2026-09-07 — WG-08, WG-09, NA-12 — Tile `−` and neighbor-pick are gone. The selected tile shows a red X with no red outline (selection may be for `+` or Path-pull). X, Delete, Remove Node, and inspector Remove act on that Node only: auto restitch applies immediately; many-to-many still opens the pairing preview. Root explains WG-06. After Before-origin explains BA-04. Merged-tile X in After is Unmerge. Neighbors are not deletion candidates. — approved by user
- 2026-09-07 — MG-08 — Merge groups use a dedicated React Flow node type. The Robot stays normal size; internals do not stretch a Step Who column. — approved by user
- 2026-09-07 — NG-02 — Dragging a selected Step or Data onto a Path inserts it between the Path’s ends. The original condition moves to S→T (closer to the root); T→U is unlabeled. Empty-canvas drop cancels. Root cannot insert. After Before-origin insert is rejected. — approved by user
- 2026-09-07 — NG-03 — Direct Path deletion remains forbidden. There is no Path `−`. — approved by user
- 2026-09-07 — NA-07, PC-02, PC-03 — Step inspector no longer shows Split (“1 Path / All Paths” / One of / Every). Stored `split` remains and still seeds new outgoing Paths. The user sets stroke per Path: Dotted or Solid, via double-click, Path inspector, or the existing keybind. Changing one Path does not rewrite the others. — approved by user
- 2026-09-07 — NA-08 — Enter on a selected Path opens an on-canvas editor on that Path’s condition chip (Excalidraw-style). The inspector **label** field mirrors the value and is not focused. Enter on Data still focuses the inspector Label unless the same overlay is reused. — approved by user
- 2026-09-07 — P-08 — Double-click on a Path toggles dotted/solid. Double-click still does not zoom. — approved by user
- 2026-09-07 — CX-06 — Node removal uses a short bubble-pop (scale up then vanish), not a vertical squash. Reduced motion stays immediate. — approved by user
- 2026-09-07 — WG-07 — While the `+` tab is pulled past the preview threshold, the board dims behind a scrim; the source tile and previews stay undimmed. A triangular wedge with contrasting fill connects the source tile to the preview cluster. Drop rules unchanged. — approved by user
- 2026-09-07 — NG-02, CX-05 — While a selected Step or Data is dragged over a Path, the board may show a local insert preview (split Path, landing gap, S and T eased along that run). Displayed positions during the gesture are not saved. Drop still commits `insertNodeOnPath` and then the derived ELK layout; empty drop cancels. — approved by user
- 2026-09-07 — CX-07 — Selecting a Step or Data does not translate the tile. Drag-lift may still raise a tile. Selection remains the existing outline (and selected-tile chrome), not a position change. — approved by user
- 2026-09-07 — P-01, SH-01, SH-02 — Before / After / Both uses a chunky ink-or-cream frame (not the cyan hairline). The selected segment’s yellow fill meets the outer radius of that segment. — approved by user
- 2026-09-07 — NA-05, NA-10 — Type Other does not print “Other” on the tile. The tile headline is the Name field (empty Name → no headline). The inspector Type button remains labeled Other. — approved by user
- 2026-09-07 — NA-12 — Inspector Node removal is a trash control at the top right of the Step / Data form. It still calls the same remove path as the tile X / Delete (selected Node only). — approved by user
- 2026-09-07 — SH-02 — Before / After / Both is named only by the top-bar switch. The board does not show BEFORE / AFTER corner chips. — approved by user
- 2026-09-07 — P-08 — Mouse-wheel zoom uses small steps. When zooming in on empty paper while the graph is a small island in the viewport, the focal point is the laid-out graph, not the empty point under the cursor. — approved by user
- 2026-09-07 — P-07 — Present remains the first hamburger item. Present hides the inspector, NodeToolbars, merge dock, and contextual hints; disables all editing; Space toggles Before/After. There is no automation score in the top bar. Exiting Present restores the previous view and selection state. — approved by user
- 2026-09-07 — BA-08 — The automation score is withdrawn. The inspector footer and Present copy (“N Steps out of M will become automated…”) are removed. — approved by user
- 2026-09-07 — P-07, P-10 — Hamburger menu options are text only (no left-section icons). The menu button itself may keep the hamburger glyph. — approved by user
- 2026-09-07 — P-02, P-05, P-07, MG-01..MG-10, BA-04, BA-05, SH-07, SH-14 — Merge / Unmerge is withdrawn from the product until a later redesign. There is no merge dock, no merge tile, and no Merge/Unmerge keys. After shows Before-origin Steps individually. Saved documents may still contain `after.groups`; load unfolds them and writes empty groups. Robot Mailroom has no preconfigured merge group. — approved by user
- 2026-09-07 — WG-07 — While the `+` tab is pulled, the board still dims behind a scrim (source tile and previews stay undimmed). The connector from the tab to the pointer is the green stretchy taffy (Improvement 02), not a triangular wedge. Releasing on empty space dismisses the fan and scrim immediately (the tab may snap back). Drop rules unchanged. — approved by user
- 2026-09-07 — CX-01 — Selected-tile `+` and Path tabs sit behind the tile face and peek from the right edge (pull-tabs). They are not stacked on top of the border. — approved by user
- 2026-09-07 — WG-07, AQ-01 — The Path-pull tab glyph is a spindle with a string, not a knot or key. Pull behavior unchanged. — approved by user
- 2026-09-08 — WG-01 — A brand-new board still has zero Nodes and the default roster. The empty-state actions are **Add Step** and **Add Data**; either creates the root. Add Step still assigns the default Human. Add Data has no Who. — approved by user
- 2026-09-08 — WG-02 — The first Node (Step or Data) becomes the sole root. Every nonempty document has exactly one root. The root has no incoming Paths; a connection into the root is rejected. — approved by user
- 2026-09-08 — WG-06 — The root cannot be removed while any other base Tile remains. If the base graph has exactly one Tile, deleting it empties the board (actors kept; After extras pruned) and returns the empty-state CTA. — approved by user
- 2026-09-08 — BA-03, BA-04 — After may remove Before-origin Nodes; the shared base updates and Before reflects it. After-only Steps remain After-only and may still be removed only in After. Merge stays withdrawn. — approved by user
- 2026-09-08 — CX-07, CX-01 — Selected Step/Data uses a drop-shadow on the tile face, not a second outline ring. Selected-tile `+` and Path tabs are vertically centered on the right edge (still tucked behind the face). Pulled `+` taffy joins the tile with a solid flat attach, not a concave origin hole. — approved by user
- 2026-09-08 — NG-02 — After may insert a Before-origin Tile onto a base Path (same as Before). The root still cannot insert. Merge stays withdrawn. — approved by user
- 2026-09-08 — CX-01, WG-07 — Selected-tile `+` and Path tabs sit **on top** of the tile’s right edge (same stacking as the X). The pulled `+` taffy and Path string emerge from **under** the tile face; the `+` / Path ghost stays on top. — approved by user
- 2026-09-08 — CX-07 — Selected Step/Data uses a gold halo on the tile face (box-shadow rim and glow, plus a stronger ground shadow), not a CSS outline on the chrome. — approved by user
- 2026-09-08 — CX-07 — Selected Step/Data uses a blue halo on the tile face and no ground shadow (flat). Drag-lift may still raise a tile. — approved by user
- 2026-09-08 — PC-01, PC-02, PC-03 — Every Path is the same object: dotted or solid. Step and Data ends do not change Path type. The drawn stroke is that Path’s own flag, including a single outgoing Path. Double-click, inspector Dotted/Solid, and the keybind toggle that Path. Split still seeds new outgoing Paths from a Step (exclusive + two or more → dotted). — approved by user
- 2026-09-08 — WG-07, AQ-01 — The Path-pull tab glyph is a chunky orthogonal fork of rounded path tracks (trunk splitting into Paths), not a spindle. Pull behavior unchanged. — approved by user
- 2026-09-08 — CX-07 — Selected Step/Data uses a blue rim on the tile face, with no glow and no ground shadow (flat). Drag-lift may still raise a tile. — approved by user
- 2026-09-08 — WG-07, AQ-01 — The Path-pull tab glyph is two round terminals joined by a short Path (connect two Nodes; no plugs). Pull behavior unchanged. — approved by user
- 2026-09-08 — WG-07, AQ-01 — The Path-pull tab glyph is a short dotted Path (round dashes), not plugs, a fork, or a row of dots. Pull behavior unchanged. — approved by user
- 2026-09-08 — NG-02, CX-05 — While a selected Step or Data is dragged over a Path, the insert preview is the blue band on that Path’s ELK route plus a landing silhouette and local neighbor gap. Split orthogonal stubs and the right-angle fallback are not the preview. Paths that touch the dragged tile, and Paths that share that tile’s ELK trunk or inbound merge, are not drop targets and fade with the origin. Displayed positions during the gesture are not saved. — approved by user
- 2026-09-08 — P-08, CX-07 — Editable Step and Data tiles use a four-way move cursor (not the pointer hand). Empty paper stays grab-to-pan. During tile-drag the move cursor follows the pointer. — approved by user
- 2026-09-08 — WG-05, NG-03, NA-12, AQ-01 — A Path may be removed when every remaining Tile is still reachable from the root. Right-click a Path for a menu; Delete is included when that Path may be removed. The Delete key removes that Path when allowed; otherwise it explains that the Path is the only route to a Tile. The inspector still has no Path delete control. — approved by user
- 2026-09-08 — CX-02 — Path stroke hit pads are wider so Paths are easier to select; condition chips stay independent hit targets. — approved by user
