# Automation Pitch — post-relay review plan

Use this in a **fresh chat** to help the user verify the twelve-slice relay. You are a reviewer, not the next implementing agent. Do not start a Slice 13. Do not guess product changes. Record defects; only patch if the user asks.

Contract: `.docs/GOAL.md` (never edit clauses). History: `.docs/handoff.md`. Plan: `.docs/BUILD_PLAN.md` Section 6. This file is the operating checklist.

## 0. Kickoff

```text
You are the review agent for Automation Pitch after the 12-slice relay.
Read .docs/REVIEW_PLAN.md, .docs/GOAL.md, .docs/handoff.md (Slice 12 last),
and README.md. Confirm git log includes feat(slice-12) and the tree is clean.
Run npm install, npm run build, npm run test:unit, npm run test:e2e.
Then walk the manual protocol below and report pass / fail / residual risk
per GOAL clause. Do not implement features. Do not push.
```

## 1. Environment

- Desktop/laptop **≥ 1024 CSS pixels**. Narrower windows must show “This window is too narrow”, not a crushed board (P-04).
- `npm install` then `npm run dev`. First visit loads **Oak Park Invoice**.
- `npx playwright install chromium` if e2e says the browser is missing.
- Scripts: `npm run build`, `npm run test:unit`, `npm run test:e2e`, `npm test`.
- Expected green at Slice 12: **build pass**, **137 unit tests / 28 files**, **72 Playwright tests**.

## 2. What the relay built (one line each)

| Slice | Commit subject (match `git log`) | User-visible outcome |
| --- | --- | --- |
| 00 | `chore(slice-00): establish automation pitch baseline` | Frozen snapshot of the pre-relay app |
| 01 | `feat(slice-01): add contract-verified test harness` | Vitest, Playwright, axe smoke |
| 02 | `feat(slice-02): reorganize source into feature folders` | `app/`, `board/`, `workflow/`, `state/` |
| 03 | `feat(slice-03): add v2 schema, migration, and recovery core` | Zod v2, v1 migrate, recovery hold |
| 04 | `feat(slice-04): add graph commands and bounded history` | Connect/remove rules, 500 undo |
| 05 | `feat(slice-05): add replacement gate, demos, and recovery UI` | New/Demo/Import gate, Mailroom, recovery UI |
| 06 | `feat(slice-06): add create, connect, and remove canvas UX` | NodeToolbar, picker, no Pointer/Hand |
| 07 | `feat(slice-07): rebuild inspector for Path, Who, and actors` | Path / condition, Who buttons, Manage actors |
| 08 | `feat(slice-08): add shell typography and sound` | Nunito, chunky shell, sound toggle |
| 09 | `feat(slice-09): add smart routing and reversible label layout` | Smart Edge, condition chips, restitch |
| 10 | `feat(slice-10): add After projection and comparison` | After overlay, Both isolation, score |
| 11 | `feat(slice-11): add merge, unmerge, and After-only Steps` | Merge dock, giant Step, After `+` |
| 12 | `feat(slice-12): harden release and rewrite README` | P-04, hardening suite, README, this plan |

## 3. Automated gate (do this first)

1. `git log -1` is Slice 12; `git status` is clean.
2. `npm run build` — `tsc --noEmit && vite build` succeeds (chunk-size warning is known).
3. `npm run test:unit` — 137 passed.
4. `npm run test:e2e` — 72 passed, Chromium, including axe on initial, dark shell, inspector, Mailroom After, and the unsupported view.

If any command fails, stop and report the exact command, assertion, and file. Do not “fix forward” into new features.

## 4. Manual protocol (browser)

Use `npm run dev` at **1440×900** and again at **1024×768**. Repeat critical screens in **Dark mode**. Vocabulary: Node, Step, Data, Path, condition, stroke, Who, Before / After / Both, merge group. Never “Arrow” or “label” for a Path.

### 4.1 Shell and viewport

- Top bar left: **Undo**, then **Sound off**, no Pointer/Hand, no Redo.
- Center: Before / After / Both radios (high contrast).
- Right: inspector **320 px**, score footer. Hamburger last.
- Hamburger order: Present, New, Import, Export, Actors, Keybinds, Light/Dark, divider, Demo label, Oak Park Invoice, Robot Mailroom.
- Resize below 1024 px: unsupported message; board gone. Resize back: board returns.
- Present: inspector, NodeToolbars, merge dock, and hints hidden; score in the top bar; Space toggles Before/After; Exit present restores view and selection.

### 4.2 Oak Park Invoice

- Both amount Paths are **dotted** (choice).
- Click a condition chip at default zoom and zoomed out — inspector opens **Path / condition**; the tile is not selected by accident.
- Shorten a long condition: the lane **contracts**. Reload: positions do not keep expanding.
- Select a Path: no Delete control. Delete explains that a Node must be removed.
- Delete on the root: picker of children, root stays. Recommend New for a clean board.
- Remove a middle Step (Write): restitch; Backspace undoes. With OS reduced motion, the tile vanishes without a flashing squash.

### 4.3 New, save, recovery

- New → Cancel: board unchanged. Discard: empty board, **Add Step** creates the root (Alice / default Human).
- Import `{` → Could not import; live board unchanged.
- In DevTools, set `automation-pitch.workflow` to `'{"version":1'` and reload → recovery dialog, Download recovery copy, Start fresh. Raw key is not overwritten until Start fresh.
- Theme and Sound survive reload. Rebind Undo in Keybinds, Escape, focus returns to **Menu**.

### 4.4 After, Both, merge (Robot Mailroom)

- Load Robot Mailroom (Discard). Score **3 of 6**.
- Before: no delivery-receipt Step. After: giant merge tile (scan / lookup / route internals, Recipient supporting), receipt After-only Step, merge dock.
- Both: no `+`/`−`, no dock, no inspector editing. Click a lane; pan keys move that lane only.
- After `+`: After-only Step and Connect existing; no Data. After-only Steps default to the first Robot.
- Merge two disconnected sibling Steps → explanation. Unmerge restores the whole group; Who on the giant Step applies to every member and remains after Unmerge.
- After `−` on a Before-origin Step explains it cannot be removed here; on the giant tile, Unmerge is offered.
- Present After hides the dock.

### 4.5 Accessibility spot-check

- Tab from the address bar into Undo, Sound, view radios, Menu. Shift+Tab reverse.
- Icon-only controls have tooltips and `aria-label`.
- Selection, hover, removal candidacy, and merge candidacy are distinguishable without color alone (outlines, “Remove” / “Merge” captions).
- Contrast: cream tiles on paper, ice type on the steel chrome, yellow selected view radio, yellow Merge button.

## 5. GOAL clause map

Evidence folders: `.docs/evidence/NN-<slug>/`. Slice 12 final set is `.docs/evidence/12-release/`. Tests are the executable proof; screenshots are for visual review.

### Product (P)

| ID | Proof |
| --- | --- |
| P-01 | README + 12-release Before/After/Both light/dark; no Nintendo assets in `index.html` / `src/app/sound/` |
| P-02 | e2e replace, canvas, merge, hardening; empty-new + replace-gate screenshots |
| P-03 | `e2e/routing.spec.ts` 30-object test; `09-routing/stress-30-1440.png` |
| P-04 | `12-release/unsupported-900.png`, `before-light-1024.png`; `e2e/hardening.spec.ts` viewport tests |
| P-05 | Inspector 320 in 1024 test; merge dock only in editable After (`11-merge/`, `12-release/mailroom-after-1440.png`) |
| P-06 | `06-canvas/before-light-1440.png` (no idle chips); CanvasHelper idle returns [] |
| P-07 | `12-release/present-light-1440.png`; `11-merge/present-hides-dock-1440.png`; shell.spec Present restore |
| P-08 | canvas.spec Pointer/Hand count 0; Undo + Sound in toolbar |
| P-09 | `12-release/*-dark-1440.png`; shell + hardening axe |
| P-10 | `package.json` Mantine 9 + Tabler only UI kit |

### Workflow graph (WG)

| ID | Proof |
| --- | --- |
| WG-01 | replace.spec New + Add Step; `12-release/empty-new-1440.png` |
| WG-02–04 | `src/workflow/commands.test.ts`, `graph.test.ts`; canvas connect rejections |
| WG-05 | commands.spec / canvas.spec Path Delete copy; inspector has no Path Delete |
| WG-06 | `06-canvas/root-blocked-1440.png` |
| WG-07 | `06-canvas/plus-menu-1440.png`; canvas.spec empty-canvas does not create a Step |
| WG-08–12 | canvas.spec picker, 1:N, N:1, M:N; `06-canvas/remove-*.png` |
| WG-13 | `src/state/history.test.ts` cap 500; undo does not change view |

### Paths / nodes / canvas (PC, NA, CX)

| ID | Proof |
| --- | --- |
| PC-01–03 | inspector.spec stroke + Split; `07-inspector/path-condition-1440.png`, `split-every-1440.png` |
| PC-04 | commands.test stroke collapse |
| PC-05 | routing.spec dotted after Smart Edge; projection tests |
| PC-06 | Oak Park amount Paths dotted in 05-replace / 12-release Before |
| NA-01–02 | inspector.spec Manage actors; `07-inspector/delete-blocked-1440.png`, `manage-actors-1440.png` |
| NA-03–06 | Who in both lanes; `07-inspector/who-*.png`; merge NA-04 robot auto-create in merge tests |
| NA-07–12 | Path / condition copy; Enter on Path/Data; inspector Remove → picker |
| CX-01 | NodeToolbar in canvas.spec |
| CX-02–05 | routing.spec chips, contract, zoom; `09-routing/*.png` |
| CX-06 | routing restitch + `12-release/reduced-motion-restitch-1440.png` |
| CX-07–08 | remove-candidate CSS captions; Escape / empty-canvas in canvas.spec |

### Before / After / merge (BA, MG)

| ID | Proof |
| --- | --- |
| BA-01–02 | projection tests; `10-projection/shared-edit-1440.png` |
| BA-03–04 | After origin blocked; `10-projection/after-origin-blocked-1440.png` |
| BA-05 | projection.spec Both pan target; `10-projection/both-light-1440.png` |
| BA-06–07 | merge.spec After `+` and After-only remove; `11-merge/after-plus-1440.png` |
| BA-08 | Mailroom score 3 of 6; scoring.test.ts |
| BA-09 | commands pruneAfterOverlay tests |
| MG-01–10 | `e2e/merge.spec.ts`, `src/workflow/merge.test.ts`, `11-merge/*.png`, `12-release/mailroom-after-1440.png` |

### Shell / a11y / non-goals (SH, AQ, NG)

| ID | Proof |
| --- | --- |
| SH-01–02 | `08-shell/` and `12-release/` chrome screenshots |
| SH-03–04 | shell.spec sound off default; `cues.ts` Web Audio only |
| SH-05–07 | hamburger order in hardening.spec; demos.test.ts; Appendix A Mailroom |
| SH-08–13 | migrate.test.ts; replace.spec recovery/import; `12-release/recovery-1440.png`, `not-saved-1440.png` |
| SH-14 | bindings.test.ts retired keys; `12-release/keybinds-1440.png` |
| SH-15 | `index.html` has no Google Fonts; `@fontsource-variable/nunito` |
| AQ-01–03 | keybinds catalog; Menu focus after Keybinds (hardening.spec) |
| AQ-04–05 | axe in smoke/shell/inspector/hardening; reduced-motion screenshot |
| AQ-06–07 | Vitest workflow tests + Playwright critical flows |
| NG-01–09 | no mobile UI; Export is a hamburger YAML download (Improvement 32); no CLI exporter; no Pointer/Hand; Path delete is allowed when reachability holds; no nested merge |

## 6. Known non-blockers (do not expand scope)

Logged by Slice 11; still true after Slice 12:

- Mailroom giant-Step internal condition text truncates past ~22 characters (compact tile).
- An After-only Path leaving a base Step does not rewrite that Step’s base Split/strokes (would leak into Before).
- Vite chunk-size warning (~900 kB main bundle) is unchanged; Smart Edge + Mantine.
- React Flow prints a Pro attribution console warning (`hideAttribution`); not a product defect.
- Duplicate Slice 10 ledger block in `handoff.md` is historical; do not rewrite earlier entries.

## 7. Report format

Return a short review to the user:

1. Commands run and exact pass/fail counts.
2. Manual protocol: which steps you executed, with viewport and theme.
3. Clause groups: all pass, or list failing IDs with screenshot/test evidence.
4. Residual risk that is not a GOAL miss (performance feel, copy nits).
5. No implementation unless they ask for a named fix.
