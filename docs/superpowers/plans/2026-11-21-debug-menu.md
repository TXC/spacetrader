# Debug Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** A ☰ menu in the debug panel with a Cheats checkbox, a Game state
checkbox that shows the saved game as a folding tree, and the Copy Action
Log button.

**Architecture:** A new `StateTree` component draws any JSON-like value as
nested `<details>`. `DebugPanel` gains the menu (a browser `popover`) and
two pieces of local state that decide whether the cheats and the tree are
drawn. `App` already shows the panel only in debug mode; that stays.

**Tech Stack:** React 19, TypeScript, CSS modules, Vitest in the browser
(Playwright).

**Spec:** `docs/superpowers/specs/2026-11-20-debug-menu-design.md`

## Global Constraints

- No new dependency.
- Nothing changes outside debug mode (`App` keeps its
  `runtime.debugMode !== DebugMode.Disabled` check).
- Both checkboxes are off at start and are not remembered after a reload.
- Tree branches are closed at start.
- The checkboxes are not recorded in the action log (plain `<input>`, not
  `LoggedButton`).
- Run single test files with `pnpm vitest run <file>`; the full check is
  `pnpm check`.

## Review Focus

1. A branch the developer opened stays open when the game changes and the
   panel redraws. Pinned in Task 1 (`keeps an opened branch open`).
2. Text and numbers look different in the tree (`"5"` against `5`), and
   `null` shows. Pinned in Task 1 (`shows leaves as JSON`).
3. With Cheats off, no cheat button is on the page, so no element id is
   used twice next to the test harness's own `#cheats`. Pinned in Task 2.
4. Game state ticked before a game exists shows "No game yet." instead of
   failing. Pinned in Task 2.
5. Clicking outside the open menu closes it. The browser's `popover="auto"`
   does this; no test, check it by hand in Task 2, Step 6.

---

### Task 1: The state tree

**Files:**
- Create: `src/ui/StateTree.tsx`
- Create: `src/ui/StateTree.module.css`
- Test: `src/tests/stateTree.test.tsx`

**Interfaces:**
- Produces: `export function StateTree({ name, value }: { name: string;
  value: unknown })`. Objects and arrays become a `<details>` (closed)
  whose `<summary>` is the name, and for arrays the name followed by
  ` [n]`; their entries are child `StateTree`s keyed by entry key. Any
  other value is one line: `name: ` then `JSON.stringify(value)`, or
  `undefined` when that returns undefined.

- [ ] **Step 1: Write the failing tests** in `src/tests/stateTree.test.tsx`,
  drawing with `render` from `./support/render.tsx`:
  - `shows leaves as JSON`: draw `{ a: 5, b: '5', c: null, d: true }`
    named `game`; the text contains `a: 5`, `b: "5"`, `c: null`,
    `d: true`.
  - `starts with every branch closed`: draw
    `{ commander: { ship: { hull: 3 } } }`; every `details` element has
    `open === false`.
  - `names a list with its length`: draw `{ cargo: [1, 2, 3] }`; a
    `summary` has text `cargo [3]`.
  - `keeps an opened branch open`: draw `{ x: { y: 1 } }` with `root`
    returned by `render`, set the `x` branch's `open = true`, draw again
    with `{ x: { y: 2 } }` inside `flushSync`; the branch is still open and
    shows `y: 2`.

- [ ] **Step 2: Run them to see them fail**

  Run: `pnpm vitest run src/tests/stateTree.test.tsx`
  Expected: FAIL, the module `../ui/StateTree.tsx` does not exist.

- [ ] **Step 3: Implement `StateTree`** in `src/ui/StateTree.tsx` as the
  Interfaces block says. Never pass `open` to `<details>`: the browser
  keeps the open state, which is what makes test 4 pass. In
  `StateTree.module.css`, indent children (`padding-left: 1rem`) and use a
  monospace font.

- [ ] **Step 4: Run the tests to see them pass**

  Run: `pnpm vitest run src/tests/stateTree.test.tsx`
  Expected: 4 passed.

- [ ] **Step 5: Commit**

  ```bash
  git add src/ui/StateTree.tsx src/ui/StateTree.module.css src/tests/stateTree.test.tsx
  git commit -m "feat(debug): show a value as a folding tree"
  ```

### Task 2: The menu in the debug panel

**Files:**
- Modify: `src/ui/DebugPanel.tsx`
- Modify: `src/ui/DebugPanel.module.css`
- Test: `src/tests/debugPanel.test.tsx`

**Interfaces:**
- Consumes: `StateTree` from Task 1; `useSession()` from
  `src/ui/useStore.ts`.
- Produces, as element ids the tests use:
  - `debugMenuButton`: the ☰ button, `popoverTarget="debugMenu"`,
    `aria-label="Debug menu"`.
  - `debugMenu`: the menu, `popover="auto"`, placed top right of the page.
  - `showCheats`, `showGameState`: the two checkboxes, each in a `<label>`
    reading `Cheats` and `Game state`.
  - `copyActionLog`: the copy button, moved into the menu, unchanged.
  - `cheats`: the cheat buttons' wrapper, drawn only when `showCheats` is
    ticked.
  - `gameState`: wraps `<StateTree name="game"
    value={session.game.toState()} />`, or the text `No game yet.` when
    `session.game` is null; drawn only when `showGameState` is ticked.
  - `debugLog`: the action log text, where it is today.

- [ ] **Step 1: Update and add the failing tests** in
  `src/tests/debugPanel.test.tsx`:
  - The existing panel test: before clicking `#cheat_freeMoney`, assert
    `host.querySelector('#cheats')` is null, then click `#showCheats`.
    Everything else stays.
  - `shows the game state when asked`: replay the same one-step log, draw
    the panel, assert `#gameState` is null, click `#showGameState`; a
    `summary` with text `game` is inside `#gameState`.
  - `says when there is no game yet`: draw the panel with a `new Session()`
    whose `game` is null (set `runtime.actionLog` as `runReplayLog` does),
    click `#showGameState`; `#gameState` has text `No game yet.`

- [ ] **Step 2: Run them to see them fail**

  Run: `pnpm vitest run src/tests/debugPanel.test.tsx`
  Expected: FAIL, `#showCheats` and `#showGameState` are not found.

- [ ] **Step 3: Implement the menu** in `DebugPanel.tsx`: two `useState`
  booleans, both `false`, driving the two checkboxes and what is drawn, as
  the Interfaces block says. Call `useSession()` for the game. Style the
  button and menu in `DebugPanel.module.css`, with the menu's items one per
  line.

- [ ] **Step 4: Run the panel tests to see them pass**

  Run: `pnpm vitest run src/tests/debugPanel.test.tsx`
  Expected: 4 passed.

- [ ] **Step 5: Run the full check**

  Run: `pnpm check`
  Expected: format, lint, typecheck, coverage and the offline check all
  pass.

- [ ] **Step 6: Check by hand** with `pnpm dev`: the ☰ button shows, the
  menu opens and closes when clicking outside it, ticking Cheats shows the
  buttons, ticking Game state shows the tree, and an opened branch stays
  open after pressing a game button.

- [ ] **Step 7: Commit**

  ```bash
  git add src/ui/DebugPanel.tsx src/ui/DebugPanel.module.css src/tests/debugPanel.test.tsx
  git commit -m "feat(debug): put cheats, game state and copy in a menu"
  ```
