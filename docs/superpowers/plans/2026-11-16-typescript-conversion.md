# TypeScript Conversion (Step 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** The game in `old/js/` runs inside the Vite + React + TypeScript
project, with the game rules strictly typed and the old tests passing.

**Architecture:** Every old file becomes an ES module. Rules go to
`src/game/`, old screens to `src/legacy-ui/`, tests to `src/tests/`.
Everything moves first with type checking off until the tests pass; then
the rules files are typed one at a time with the tests green after each.

**Tech Stack:** TypeScript 6, Vite 8, React 19, Vitest in browser mode
(headless Chromium through Playwright), pnpm.

**Spec:**
`docs/superpowers/specs/2026-11-16-typescript-conversion-design.md`

## Global Constraints

- No change in game behaviour. Same seed, same actions, same result.
- Never edit a test to make it pass. Allowed test edits are listed in
  Task 3 and nowhere else.
- No renaming of files, classes, functions or constants. No tidying.
- `old/js/` is never modified. It is the reference to compare against.
- No `enum` (the project sets `erasableSyntaxOnly`). Constant objects stay
  objects, marked `as const`.
- No `any` in `src/game/` unless a comment on that line says why.
- Files in `src/game/` may import from `src/legacy-ui/`.
- Baseline to match: **153 tests, 3,064 assertions, all passing.**
- Out of scope: React screens, any visual change, the service worker,
  `manifest.json`, `generate-sw.sh`, `cheats.html`, a Makefile.
- Work on branch `feature/typescript-conversion`. No remote exists; do
  not push.
- New dev dependencies are limited to `vitest`, `@vitest/browser` and
  `playwright` (plus the Playwright provider package if the installed
  Vitest version ships it separately).

## Review Focus

1. **App mounted twice.** React `StrictMode` runs effects twice in dev.
   Expected: one game, one set of screens. Test in Task 2.
2. **Load order differs between app and tests.** Import cycles can throw
   "cannot access before initialization" under one entry point and not
   the other. Expected: both load. Covered by Task 2 (app test) and
   Task 3 (suite) running in the same `pnpm test`.
3. **Minified production build.** Expected: the built game starts and a
   saved game loads. No code may rely on class names (`constructor.name`
   has zero uses today; keep it so). Manual check in Task 9.
4. **Existing saved games.** Expected: a save made by the old code loads
   in the new code. Storage keys and the saved shape must not change.
   Test in Task 3.
5. **Canvas sizing inside the React host.** The galaxy chart sizes
   itself from its container. Expected: it draws at the same size as in
   `old/js/`. Manual check in Task 9.

---

## File map

| Old file (in `old/js/`) | New file |
|---|---|
| `GameRand.js`, `Utilities.js`, `SSSTActionLogger.js`, `SSSTCrewMember.js`, `SSSTCommander.js`, `SSSTOpponent.js`, `SSSTGame.js`, `SSSTSolarSystem_h.js`, `SSSTSolarSystem.js`, `SSSTTradeItem_h.js`, `SSSTTradeItem.js`, `SSSTPolitics.js`, `SSSTSpecialEventSpecifier.js`, `SSSTAccessory.js`, `SSSTShip.js`, `SSSTEncounterController.js`, `PCEImage.js`, `Images.js` | `src/game/<same name>.ts` |
| every `SSST*ViewController.js`, `SSSTGalaxyView.js`, `SSSTBattleOpponentView.js`, `SSSTTravelProgressView.js`, `main.js` | `src/legacy-ui/<same name>.ts` |
| `style.css` | `src/legacy-ui/style.css` |
| `UnitTests.js` | `src/tests/UnitTests.ts` |
| (new) | `src/game/runtime.ts` |
| (new) | `src/tests/unit.test.ts`, `src/tests/stress.test.ts`, `src/tests/app.test.tsx` |

---

### Task 1: Move all source files into modules, type checking off

**Files:**
- Create: every `src/game/*.ts` and `src/legacy-ui/*` in the file map,
  and `src/game/runtime.ts`
- Modify: `eslint.config.js`, `tsconfig.app.json`

**Interfaces:**
- Produces: `src/game/runtime.ts` exporting

  ```ts
  export const runtime: {
    gameRand: MAGameRand
    actionLog: SSSTActionLogger
    stLocalStorage: Storage | SSSTMockLocalStorage
    debugMode: number
  }
  ```

  The property names equal the old global names on purpose. The old
  fifth global, `caughtError`, is used only by the test page and moves
  to the tests in Task 3.
- Produces: every top-level `class`, `const`, `let` and `function` of
  each old file as a named export of its new file, under the same name.
  `SpaceTraderGame` is exported from `src/legacy-ui/main.ts`.

- [ ] **Step 1: Copy and rename.** Copy each file per the file map,
  changing `.js` to `.ts`. Put `// @ts-nocheck` on the first line of
  each. Do not change anything else yet.

- [ ] **Step 2: Create `src/game/runtime.ts`** with the interface above.
  Use type-only imports for the three types. The initial value is an
  empty object cast to the type; the host fills it before the game
  starts.

- [ ] **Step 3: Set up the lint as the missing-import detector.** In
  `eslint.config.js`, add an override for `src/game/**`,
  `src/legacy-ui/**` and `src/tests/**` that:
  - turns `no-undef` on as an error (typescript-eslint turns it off, and
    with type checking off nothing else reports a missing import),
  - turns off `@typescript-eslint/ban-ts-comment`,
  - turns off the rules the old style trips that are not bugs:
    `prefer-const`, `no-unused-vars`,
    `@typescript-eslint/no-unused-vars`, `no-case-declarations`,
    `no-prototype-builtins`, `@typescript-eslint/no-this-alias`,
    `@typescript-eslint/no-unused-expressions`.
  If another style rule fires, add it to this list. Never change code to
  satisfy a style rule in this task.

- [ ] **Step 4: Run the lint to see what is missing.**

  Run: `pnpm install && pnpm lint`
  Expected: FAIL, with `no-undef` errors naming every identifier that
  used to be a global.

- [ ] **Step 5: Add exports and imports.** Add `export` to every
  top-level declaration. In each file, import each name `no-undef`
  reports from the file that declares it. Replace bare `gameRand`,
  `actionLog`, `stLocalStorage` and `debugMode` with `runtime.gameRand`
  and so on (31 files read them; `SSSTActionLogger.js:156` also assigns
  `gameRand`). `src/legacy-ui/main.ts` also imports `./style.css`.

- [ ] **Step 6: Add `"strict": true`** to `compilerOptions` in
  `tsconfig.app.json`.

- [ ] **Step 7: Verify.**

  Run: `pnpm lint && pnpm build`
  Expected: both pass. `pnpm build` fails on any import of a name its
  target does not export.

- [ ] **Step 8: Commit.**

  ```bash
  git add src eslint.config.js tsconfig.app.json pnpm-lock.yaml
  git commit -m "refactor: move old game into ES modules, types off"
  ```

---

### Task 2: Host the game in React, with the test runner

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`, `package.json`,
  `vite.config.ts`, `tsconfig.node.json` (only if the Vitest config
  types need it)
- Delete: `src/App.css`, `src/index.css`
- Test: `src/tests/app.test.tsx`

**Interfaces:**
- Consumes: `runtime`, `SpaceTraderGame`, `MAGameRand`,
  `SSSTActionLogger`, `MADebugMode` from Task 1.
- Produces: `App` (default export of `src/App.tsx`) rendering
  `<div id="game">`. Scripts `pnpm test` and `pnpm test:stress`.

- [ ] **Step 1: Install and configure Vitest browser mode.** Add
  `vitest`, `@vitest/browser` and `playwright` as dev dependencies and
  install Chromium for Playwright. Configure in `vite.config.ts`:
  browser mode on, Chromium, headless, test timeout 120 seconds. Check
  the installed Vitest version's documentation for the exact option
  names; they have changed between major versions. Add scripts:

  ```json
  "test": "vitest run --exclude src/tests/stress.test.ts",
  "test:stress": "vitest run src/tests/stress.test.ts"
  ```

- [ ] **Step 2: Write the failing test** in `src/tests/app.test.tsx`:

  ```tsx
  test('App starts exactly one game under StrictMode', async () => {
    localStorage.clear()
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    await act(async () => {
      root.render(<StrictMode><App /></StrictMode>)
    })
    expect(document.querySelectorAll('#game').length).toBe(1)
    expect(document.querySelectorAll('#newCommanderDiv').length).toBe(1)
    root.unmount()
    host.remove()
  })
  ```

- [ ] **Step 3: Run it to see it fail.**

  Run: `pnpm test`
  Expected: FAIL, `#newCommanderDiv` count is 0.

- [ ] **Step 4: Implement `App`.** It renders only `<div id="game">`.
  One effect does what the inline script in `old/js/index.html` did, once:

  - `const randSeed = Date.now()`
  - `runtime.debugMode = MADebugMode.Disabled`
  - `runtime.gameRand = new MAGameRand(randSeed)`
  - `runtime.actionLog = new SSSTActionLogger(randSeed)`
  - `runtime.stLocalStorage = localStorage`
  - `new SpaceTraderGame(gameDiv, true).main()`

  Guard against the second `StrictMode` run with a ref. Leave out the
  debug panel, the action-log replay hook, the service worker
  registration and the navigation links from `old/js/index.html`. Remove
  the template content and the two template stylesheets; drop the
  `index.css` import from `src/main.tsx`.

- [ ] **Step 5: Run the test to see it pass.**

  Run: `pnpm test`
  Expected: PASS, 1 test.

- [ ] **Step 6: Play it.** Run `pnpm dev`, create a commander, buy
  cargo, warp once. Compare the look against `old/js/index.html` opened in
  a browser. Expected: identical, apart from the missing navigation
  links.

- [ ] **Step 7: Commit.**

  ```bash
  git add -A
  git commit -m "feat: host the old game in the React app"
  ```

---

### Task 3: Run the old test suite in Vitest

**Files:**
- Create: `src/tests/UnitTests.ts`, `src/tests/unit.test.ts`,
  `src/tests/stress.test.ts`

**Interfaces:**
- Consumes: all exports from Task 1.
- Produces: `UnitTests`, `MALog` and `getAssertionCount(): number`
  exported from `src/tests/UnitTests.ts`.

- [ ] **Step 1: Copy `old/js/UnitTests.js`** to `src/tests/UnitTests.ts`
  with `// @ts-nocheck` on the first line.

- [ ] **Step 2: Make the allowed edits, and only these:**
  - add imports for the names `no-undef` reports,
  - export `UnitTests` and `MALog`,
  - add `export function getAssertionCount() { return assertionCount }`,
  - replace bare `gameRand`, `actionLog`, `stLocalStorage` and
    `debugMode` with the `runtime.` form (the file assigns them in 5
    places),
  - declare `let caughtError = null` at module level, because
    `_runTestsMatching` reads it.

- [ ] **Step 3: Write `src/tests/unit.test.ts`.**
  - `beforeAll`: import `../legacy-ui/style.css`; append
    `<div id="game">` and `<div id="cheats" class="hidden">` to the
    body; set `runtime.debugMode = MADebugMode.Assert`.
  - Create one `UnitTests` instance. For each method name on its
    prototype that starts with `test`, register
    `test(name, () => ut[name]())`.
  - `afterEach`: clear `#game` and call
    `SSSTAlertViewController.clearAlerts()`, as `old/js/unitTests.html`
    did.
  - Final test, registered last:

    ```ts
    test('matches the baseline counts', () => {
      expect(testNames.length).toBe(153)
      expect(getAssertionCount()).toBe(3064)
    })
    ```

- [ ] **Step 4: Add the saved-game test** to `src/tests/unit.test.ts`.
  Make the fixture first: open `old/js/index.html` in a browser, create a
  commander named `Fixture`, and copy every `localStorage` key and value
  the game wrote into `src/tests/fixtures/old-save.json`.

  ```ts
  test('a save written by the old code loads', () => {
    const storage = new SSSTMockLocalStorage()
    for (const [k, v] of Object.entries(oldSave)) storage.setItem(k, v)
    runtime.stLocalStorage = storage
    const stG = new SpaceTraderGame(document.getElementById('game'), true)
    stG.main()
    expect(stG.viewController._game.commander.name).toBe('Fixture')
    expect(document.getElementById('systemLandingDiv')).not.toBeNull()
  })
  ```

- [ ] **Step 5: Write `src/tests/stress.test.ts`**, the same wrapper for
  methods starting with `stress`, without the count test.

- [ ] **Step 6: Run.**

  Run: `pnpm test`
  Expected: PASS, 156 tests (153 old, the count test, the saved-game
  test, the app test). A failure here is a conversion mistake in Task 1:
  fix the moved code, not the test. A "cannot access before
  initialization" error is an import cycle; fix it by moving the import
  of the parent class or constant earlier, not by restructuring.

- [ ] **Step 7: Run the stress tests once** and note the result in the
  commit message.

  Run: `pnpm test:stress`
  Expected: PASS, 5 tests.

- [ ] **Step 8: Commit.**

  ```bash
  git add -A
  git commit -m "test: run the old test suite in Vitest browser mode"
  ```

---

### Tasks 4 to 8: Type the rules

Each of these tasks uses the same cycle, once per file, in the order
listed. One commit per file.

**The cycle for one file:**

- [ ] Remove `// @ts-nocheck` from the file.
- [ ] Run `pnpm build`. Expected: FAIL with type errors in that file.
- [ ] Add types until it passes:
  - constant objects get `as const`, plus a derived type next to each:
    `export type SSSTTechLevel = typeof SSSTTechLevel[keyof typeof SSSTTechLevel]`
  - class fields are declared with their types; fields the old code set
    later are declared optional or `| null` to match what the code does
  - parameters and return values are typed
  - no logic changes. If a type error exposes a real bug, leave the
    behaviour as it is, add `// @ts-expect-error` with one line saying
    why, and list it in the commit message.
- [ ] Run `pnpm build && pnpm lint && pnpm test`. Expected: all pass,
  still 156 tests and 3,064 assertions.
- [ ] Commit: `git commit -am "refactor: type <FileName>"`

After the last file of a task, remove that task's files from the relaxed
ESLint override if they pass the normal rules; otherwise leave them.

### Task 4: Constants and small rules

**Files (in order):** `src/game/GameRand.ts`, `src/game/runtime.ts`
(replace the cast with real types), `src/game/SSSTSolarSystem_h.ts`,
`src/game/SSSTTradeItem_h.ts`, `src/game/SSSTTradeItem.ts`,
`src/game/SSSTPolitics.ts`

**Interfaces:**
- Produces: derived types `SSSTTechLevel`, `SSSTStatus`, `SSSTResource`,
  `SSSTTradeItemType`, `SSSTDifficulty`, `SSSTSystemSize`,
  `SSSTSpecialEvent`, `SSSTPoliticsType` and the quest status types, each
  exported beside the constant of the same name. Later tasks use these
  names for parameters and fields.

### Task 5: Utilities, logging and images

**Files (in order):** `src/game/Utilities.ts`,
`src/game/SSSTActionLogger.ts`, `src/game/PCEImage.ts`,
`src/game/Images.ts`

**Interfaces:**
- Consumes: Task 4 types.
- Produces: typed `MAUtils`, `MAProbeLog`, `pLog`,
  `SSSTMockLocalStorage` (must satisfy the `getItem`, `setItem`,
  `removeItem` calls the game makes), `SSSTActionLogger`,
  `SSSTActionLogReplay`, `PCEImage`, `PCEWobbleImage`,
  `PCEImageLibrary`.

`Utilities.ts` builds the cheats panel from page elements
(`installCheats`). Type it in place; do not move it.

### Task 6: Ship, crew and solar system

**Files (in order):** `src/game/SSSTAccessory.ts`,
`src/game/SSSTCrewMember.ts`, `src/game/SSSTShip.ts`,
`src/game/SSSTSolarSystem.ts`

**Interfaces:**
- Consumes: Task 4 and 5 types.
- Produces: typed `SSSTAccessory`, `SSSTGadget`, `SSSTWeapon`,
  `SSSTShield`, `SSSTAccessoryType`, `SSSTCrewMember`, `SSSTShip`,
  `SSSTShipModel`, `SSSTShipModelType`, `SSSTSolarSystem`.

### Task 7: Commander, opponent and game

**Files (in order):** `src/game/SSSTCommander.ts`,
`src/game/SSSTOpponent.ts`, `src/game/SSSTGame.ts`

**Interfaces:**
- Consumes: Task 4 to 6 types.
- Produces: typed `SSSTCommander`, `SSSTOpponent`, `SSSTOpponentType`,
  `SSSTGame`, `SSSTGameEndStatus`, `SSSTRareEvent`,
  `SSSTPoliceRecordScore`, `SSSTReputationScore`.

### Task 8: Special events and encounters

**Files (in order):** `src/game/SSSTSpecialEventSpecifier.ts`,
`src/game/SSSTEncounterController.ts`

**Interfaces:**
- Consumes: Task 4 to 7 types, and the untyped
  `SSSTAlertViewController` and `SSSTPlunderViewController` from
  `src/legacy-ui/`.
- Produces: typed `SSSTSpecialEventSpecifier`,
  `SSSTEncounterController`, `SSSTEncounterType`, `SSSTEncounterMode`.

These two files call the old screens directly (36 and 15 references).
Import those classes as they are and call them as the old code does.
Their types are whatever TypeScript infers from the unchecked files; do
not write type declarations for screen code. Separating rules from
screens is step 1.5 and not part of this plan.

---

### Task 9: Final checks

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Confirm nothing in `src/game/` is unchecked.**

  Run: `grep -rl "@ts-nocheck" src/game`
  Expected: no output.

- [ ] **Step 2: Confirm no class-name reliance crept in.**

  Run: `grep -rn "constructor\.name" src`
  Expected: no output.

- [ ] **Step 3: Full verification.**

  Run: `pnpm lint && pnpm build && pnpm test && pnpm test:stress`
  Expected: all pass; 156 tests, 3,064 assertions, 5 stress tests.

- [ ] **Step 4: Play the production build.** Run `pnpm preview`. Create
  a commander, trade, warp until an encounter happens, open the galactic
  chart, reload the page. Expected: the chart draws at the same size as
  in `old/js/index.html`, and the game resumes after the reload.

- [ ] **Step 5: Replace the template `README.md`** with a short one:
  what the project is, `pnpm dev`, `pnpm test`, `pnpm test:stress`,
  `pnpm build`, and the three-step roadmap from the spec. Lines no
  longer than 80 characters.

- [ ] **Step 6: Commit.**

  ```bash
  git add -A
  git commit -m "docs: describe the converted project"
  ```
