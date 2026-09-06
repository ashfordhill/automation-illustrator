# Automation Pitch — Relay Handoff Ledger

Append-only. Never rewrite or delete an earlier entry; add a correction entry instead. One entry per slice attempt, in chronological order. The user's approval and the commit hash are appended under the entry they approve.

Rules: `.docs/BUILD_PLAN.md` (Section 4) and `.cursor/rules/agent-handoff.mdc`. Contract: `.docs/GOAL.md`.

## Entry template

Copy this block to the end of the file and fill every field. Keep the headings; use `n/a` rather than deleting a field.

```markdown
## Slice NN — <title> — <YYYY-MM-DD>

- Starting commit: `<hash>` (<subject>)
- Working tree at start: clean | <describe>
- GOAL clauses addressed: <IDs, e.g. WG-02, WG-04, PC-04>
- Library research and decisions: <what was checked, what was chosen, why>
- Files changed: <paths, grouped>
- Behavior implemented: <what a user can now do / what changed>
- Tests and exact results:
  - `npm run build` — <pass/fail, summary line>
  - `npm run test:unit` — <pass/fail, counts>
  - `npm run test:e2e` — <pass/fail, counts> | not run (no browser flow affected)
- Evidence: `.docs/evidence/NN-<slug>/<file>.png` — <what it shows> (one line per screenshot)
- Earlier-slice defects fixed: none | <what, why it blocked this slice>
- Known limitations / follow-ups: none | <item — target Slice NN>
- Status: AWAITING USER REVIEW
```

After review, the same agent appends directly beneath its entry:

```markdown
- Approved by user <YYYY-MM-DD> — commit `<hash>`
```

Corrections requested during review get their own short entry:

```markdown
## Slice NN — correction <k> — <YYYY-MM-DD>

- Requested: <what the user asked to change>
- Changed: <files / behavior>
- Tests and exact results: <as above>
- Status: AWAITING USER REVIEW
```

---

## Ledger

## Slice 00 — reviewed baseline — 2026-09-06

- Starting commit: `ed8845284da7708e94f875abc1db036bc0d84f5c` (Initial commit)
- Working tree at start: not clean (expected for Slice 0). Branch `main`. README.md modified vs the initial commit; application source, tooling, contract files, and `.gitignore` were untracked. GitHub remote `origin` exists; this relay did not push.
- GOAL clauses addressed: n/a (baseline snapshot only; no product clauses implemented)
- Library research and decisions: compared the working tree to BUILD_PLAN Section 1. No contradictions. Stack matches: Mantine 9, `@tabler/icons-react`, `@xyflow/react` 12, Zustand 5, Vite 8, TypeScript 7, `auto-text-size`. `npm run build` is `tsc --noEmit && vite build`. No sound/audio code. No unit/e2e/axe suite yet (Slice 1). No new dependencies added.
- Files changed:
  - Deleted `abandoned-version/` (ignored `node_modules` only).
  - Added `.docs/evidence/00-baseline/*.png` (15 review screenshots).
  - This handoff entry.
  - Unchanged product code. The rest of the untracked tree is the current app and the four contract files, to be committed together on approval: `.cursor/rules/agent-handoff.mdc`, `.docs/GOAL.md`, `.docs/BUILD_PLAN.md`, `.docs/handoff.md`, plus existing `.docs` design assets, `.gitignore`, `index.html`, `package.json`, `package-lock.json`, `scripts/export.mjs`, `src/**`, `tsconfig.json`, `vite.config.ts`, and the modified `README.md`.
- Behavior implemented: none. Product UI and graph behavior are frozen as captured. `abandoned-version/` is gone from the repo root.
- Tests and exact results:
  - `npm install` — up to date, audited 69 packages, 0 vulnerabilities
  - `npm run build` — pass (`tsc --noEmit && vite build`; Vite 8.2.2; client built in 1.71s; chunk-size warning on the existing 693 kB bundle, unchanged)
  - `npm run test:unit` — not run (script does not exist yet; Slice 1)
  - `npm run test:e2e` — not run (script does not exist yet; Slice 1)
- Evidence:
  - `.docs/evidence/00-baseline/before-light.png` — Before, Oak Park demo, Read invoice.pdf selected, inspector visible (1440×900)
  - `.docs/evidence/00-baseline/inspector-step-light.png` — same as before-light; inspector Step form (Type/Target/Who/Split)
  - `.docs/evidence/00-baseline/after-light.png` — After lane; Robot on automated Steps, Alice on Review
  - `.docs/evidence/00-baseline/both-light.png` — stacked Before/After comparison
  - `.docs/evidence/00-baseline/hamburger-light.png` — hamburger open: Present, Demo, New, Import, Keybinds, Dark mode
  - `.docs/evidence/00-baseline/plus-menu-light.png` — tile `+` menu (Step / Data / Existing)
  - `.docs/evidence/00-baseline/minus-pick-light.png` — tile `−` path pick (Previous/Next path, Enter Detach, Esc)
  - `.docs/evidence/00-baseline/before-light-1024.png` — Before at 1024×768 (supported min-width)
  - `.docs/evidence/00-baseline/before-dark.png` — Before in dark theme
  - `.docs/evidence/00-baseline/inspector-step-dark.png` — same as before-dark; inspector in dark
  - `.docs/evidence/00-baseline/after-dark.png` — After in dark theme
  - `.docs/evidence/00-baseline/both-dark.png` — Both in dark theme
  - `.docs/evidence/00-baseline/hamburger-dark.png` — hamburger open in dark (Light mode item)
  - `.docs/evidence/00-baseline/plus-menu-dark.png` — `+` menu in After/dark
  - `.docs/evidence/00-baseline/minus-pick-dark.png` — `−` pick in After/dark
- Earlier-slice defects fixed: none
- Known limitations / follow-ups:
  - No Vitest/Playwright/axe harness — Slice 1
  - Source folders still `chrome`/`details`/`model`/… — Slice 2
  - Document is v1; connect allows cycles/orphans; history cap 80; destructive demo fallback on bad storage — Slices 3–4
  - Demo IDs are random `nid()`; exporter has deterministic IDs (`h_alice`, `s_read`, `e_gt`, …) — Slice 5
  - Pointer/Hand tool, idle helper chips, implicit empty-canvas Step, Path delete, inspector “Arrow” copy — later slices per BUILD_PLAN
- Status: AWAITING USER REVIEW
- Approved by user 2026-09-06 — commit subject `chore(slice-00): establish automation pitch baseline`
