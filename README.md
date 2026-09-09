# Automation Pitch

A desktop workflow board for comparing a human-heavy **Before** process with a more automated **After** process. The visual and audio language is original. It does not copy Nintendo assets, sounds, typefaces, marks, or game interfaces.

The supported viewport is a laptop or monitor **at least 1024 CSS pixels wide**. Narrower windows show an unsupported-view message instead of a crushed board.

```bash
npm install
npm run dev
```

```bash
docker pull ghcr.io/ashfordhill/automation-pitch:latest
docker run --rm -p 8080:80 ghcr.io/ashfordhill/automation-pitch:latest
```

Open the URL Vite prints. First visit loads the **Oak Park Invoice** demo. **Robot Mailroom** is the compact merge / After-only showcase.

```bash
npm run build          # tsc --noEmit && vite build
npm run test:unit      # Vitest
npm run test:e2e       # Playwright Chromium, including axe
npm test               # unit then e2e
```

Chromium must be installed once: `npx playwright install chromium`.

## Using the board

- **Add Step** on an empty board creates the sole root. Tile **+** adds a Step, Data, or Connect existing (in After: After-only Step or Connect existing; no Data). Empty-canvas click cancels linking and never creates a Node.
- **− / Z**, Delete, and inspector **Remove** open the same Node-removal picker. Paths are not deleted; the workflow reconnects when a Node is removed. **Backspace** is Undo. **Z** is the default Remove Node key (**Ctrl+Z** remains Undo).
- **Before / After / Compare** sits in the top bar. Shared Step/Data/Path fields edit the same base document from either lane. Who is per-lane. Compare is read-only comparison.
- In **After**, After-only Steps exist only in After. Merge stays withdrawn.
- **Menu** (top-left hamburger): New, Import, Export, Keybinds, then Demo (Oak Park Invoice, Robot Mailroom). New / Demo / Import share Save copy / Discard / Cancel. Export and Save copy download the current board as YAML. Import accepts YAML or JSON.
- **Present** is a top-right icon (person in front of a light-blue slide). It hides the top bar, inspector, and status bar. Space toggles Before/After. Escape leaves Present.
- **Sound** starts off. The toggle after Undo plays original Web Audio cues (create, remove, reject, merge, tick). Preference persists in this browser.
- Invalid saved JSON is not overwritten. Download recovery copy or Start fresh. If the browser cannot write storage, editing continues in memory with a **Not saved** chip.

Vocabulary used in the UI: Node, Step, Data, Path, condition, stroke (solid = always visited, dotted = choice), Who, Before / After / Both, merge group.

## Architecture

The document is **version 2**: one shared base workflow plus a sparse After overlay (assignments, merge groups, After-only Steps and Paths). Files are YAML 1.2 (JSON still imports). Valid version 1 JSON migrates; invalid graphs are rejected, not repaired.

```text
src/
  app/        shell, inspector, sound, styles
  board/      React Flow adapters, tiles, routing, derived lane layout
  workflow/   document meaning, Zod schemas, graph commands, merge, score
  state/      Zustand store, history, persistence, projection
  keyboard/   rebindable key catalog
  demos/      Oak Park Invoice and Robot Mailroom YAML fixtures
```

`workflow/` is framework-free. Lane layout and Path routing are derived at render time and are not stored in undo history. Stack: Mantine 9, Tabler icons, `@xyflow/react` 12, Zustand 5, Zod 4, yaml 2, elkjs 0.12, Vitest 5, Playwright + axe.

The product contract is `.docs/GOAL.md`. The relay record is `.docs/handoff.md`. A post-relay review checklist is `.docs/REVIEW_PLAN.md`.
