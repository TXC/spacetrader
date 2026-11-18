# React Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every hand-built screen in `src/legacy-ui/` with a React
component, with the game looking and playing exactly as before.

**Architecture:** Rules found inside screens move to `src/game/`. A
`Session` object holds the game, the current screen and the map
selection; alerts are data in a global alert store. React components in
`src/ui/` read from both and redraw when they change. Screens are
converted from the leaves inward, each mounted inside its old parent
until the parent is converted, with the recorded tests passing after
every task.

**Tech Stack:** React 19, TypeScript 6 (strict), Vite 8, Vitest 5 browser
mode (headless Chromium), pnpm.

**Spec:** `docs/superpowers/specs/2026-11-16-react-conversion-design.md`

## Global Constraints

- No change in game behaviour or in the order of random draws. One
  exception: a crash that also happens in `old/js/` is fixed in its own
  commit with a test and listed in the pull request.
- Game rules never run while React draws. Anything an old screen did
  while drawing goes into a `present` function that is called where the
  old code called `presentView()`.
- Recorded tests: the steps and the expected game results never change.
  Allowed edits in `src/tests/UnitTests.ts` are import paths and the
  one-time rewrite of markup checks in Task 0.
- Every component keeps the old element ids and classes exactly,
  including ids with spaces, duplicate ids and ids that embed a table
  length.
- No look, wording or layout change. `style.css` moves unchanged.
- No rules module imports from `src/ui/` or `react`.
- React 19, strict TypeScript, no new runtime dependencies, no `enum`,
  no `any` in `src/game/` or `src/ui/` without a reason comment.
- Functions and components stay under about 20 lines; split when they
  grow.
- The app keeps `StrictMode`.
- `old/js/` is never modified.
- One pull request. Branch `feature/react-bank`. One or more commits per
  task. Do not push until the last task.
- After every task: `pnpm lint && pnpm build && pnpm test` pass.
  `pnpm test:stress` passes after Tasks 2, 6 and 9.
- The local branch `spike/bank-react` is a reference only. Write fresh.

## Review Focus

1. **A rule that runs twice under `StrictMode`.** Effects and renders
   run twice in development. Expected: opening the news, the ship yard
   or the chart in `pnpm dev` spends money, opens alerts and draws
   random numbers exactly once. Test in Task 4.
2. **A canvas left running.** Expected: after leaving a screen with a
   map, its drawing loop has stopped and its resize listener is gone.
   Test in Task 5.
3. **Real play of auto-attack.** Recordings run the rounds immediately;
   in real play they wait 1.5 seconds and the screen must update between
   rounds without a click. Expected: health bars and text update each
   round. Test in Task 6.
4. **A saved game from before the conversion.** Expected: it loads and
   shows the landing screen. The existing saved-game test must keep
   passing through Task 8.
5. **Two alerts open at once.** An alert opened by a button stays under
   the rule "handler, remove, completion". Expected: the right alert is
   on top and the replay hits the oldest one with a shared id. Test in
   Task 2.

---

## Shared interfaces

Tasks refer to these by name. They are created in Tasks 1 and 2.

```ts
// src/game/Store.ts
export class Store {
  version: number
  subscribe(listener: () => void): () => void
  changed(): void                       // bump version, tell listeners
  static flush: (run: () => void) => void  // set by the UI; default runs at once
}

// src/game/session.ts
export class Session extends Store {
  game: Game | null
  constructor(storage: Storage | MockLocalStorage, loadGame: boolean)
}

// src/game/alerts.ts  (same names the rules import today)
export const AlertActionType: { Default: 0, Destructive: 1, Cancel: 2 }
export const AlertPresentationStyle: { Default: 0, High: 1 }
export type AlertContent =
  | { kind: 'slider', id: string, min: number, max: number, value: number }
  | { kind: 'plunder', plunder: Plunder }
export class AlertAction { title: string; actionType: number; handler: (() => void) | null }
export class AlertViewController {
  constructor(alertStr: string, alertID?: string)
  completionHandler: (() => void) | null
  presentationStyle: number
  content: AlertContent | null
  addAction(title: string, actionType: number, handler: (() => void) | null): void
  presentView(): void                  // adds itself to alertStore
  press(action: AlertAction): void     // handler, remove, completion
  static presentAlertWithDismiss(alertStr: string): void
  static clearAlerts(): void
  static currentAlertTitle(): string | undefined
}
export const alertStore: Store & { open: AlertViewController[] }

// src/ui/
export function useStore<T extends Store>(store: T): T   // redraws on change
export function useSession(): Session                    // from context
export function useLogged(id: string, eventName: string,
  handler: (event: Event) => void): (event: { nativeEvent: Event }) => void
export function LoggedButton(props: { id?: string, label: string,
  disabled?: boolean, onPress: () => void }): JSX.Element
export function mountReact(container: Element, element: ReactNode): () => void
```

`useLogged` registers the id with the action log when the element
appears, and records the step when it is used. `LoggedButton` derives
its id from `id ?? label` through `Utils.sanitizedElementID`.

---

### Task 0: Check meaning, not markup

**Files:**
- Create: `src/tests/support/page.ts`
- Modify: `src/tests/UnitTests.ts`, `src/tests/unit.test.ts`

**Interfaces:**
- Produces, in `src/tests/support/page.ts`:
  - `textOf(idOrElement: string | Element): string` — the visible text,
    with each `<br>` as `\n`.
  - `hasText(root: string | Element, selector: string, text: string):
    boolean` — true when an element under `root` matching `selector` has
    exactly that text.

- [ ] **Step 1: List the checks to rewrite.**

  Run: `grep -nE "innerHTML|outerHTML" src/tests/UnitTests.ts`
  Expected: about 107 lines. Ignore the three that clear `#game`.

- [ ] **Step 2: Write `textOf` and `hasText`** with one small test each
  in `src/tests/unit.test.ts`: `textOf` on `a<br>b<br><br>c` returns
  `"a\nb\n\nc"`; `hasText` finds a `td` with text `5` and rejects `4`.

- [ ] **Step 3: Rewrite the checks,** by group:
  - `eVC_dialog`, `cargoListDiv`, `questListDiv`, `highscores`,
    `end-message`: compare `textOf(...)` with the old expected string
    after replacing each `<br>` with `\n`.
  - `newsStrDiv`: check `hasText(div, 'h4', masthead)` and compare
    `textOf` for the headlines.
  - Plunder custom view: check the quantity cell with `hasText`.
  - Roster row: check the name text and that the second cell is empty.
  - Repair panel: compare `textOf`, then check that
    `#autoRepairCheckbox` exists with its label text and that
    `#buy_escape_pod` has its label.
  - Chart: check that the first data row under the "Selected System"
    heading starts with the system name.
  Change nothing else in a test: not the recorded steps, not the
  expected game values.

- [ ] **Step 4: Run against the old screens.**

  Run: `pnpm test`
  Expected: PASS. Note the new assertion count printed by the failing
  baseline check, update the number in `src/tests/unit.test.ts`, and
  run again. This number is the baseline for all later tasks.

- [ ] **Step 5: Prove the new checks can fail.** Temporarily change one
  expected encounter text and one news headline in the tests; confirm
  both fail; revert.

- [ ] **Step 6: Commit.** `test: check what the player sees, not the markup`

---

### Task 1: Shared pieces and the bank

**Files:**
- Create: `src/game/Store.ts`, `src/game/session.ts`,
  `src/game/Bank.ts`, `src/game/Bank.test.ts`, `src/game/Store.test.ts`,
  `src/ui/useStore.ts`, `src/ui/SessionContext.tsx`,
  `src/ui/useLogged.ts`, `src/ui/LoggedButton.tsx`,
  `src/ui/mountReact.ts`, `src/ui/Bank.tsx`,
  `scripts/compare-screens.mjs`
- Modify: `src/game/ActionLogger.ts`, `vite.config.ts`,
  `src/legacy-ui/SystemLandingViewController.ts`, `package.json`
- Delete: `src/legacy-ui/BankViewController.ts`

**Interfaces:**
- Produces: everything under "Shared interfaces" except `alerts.ts`.
- Produces: `ActionLogger.record(id: string, eventName: string): void`
  and `ActionLogger.register(id: string, eventName: string): void`.
- Produces, in `src/game/Bank.ts`:
  - `borrowable(commander: Commander): number`
  - `steps(max: number): { tiny: number, medium: number, max: number }`
    with `tiny = max(5, floor(max / 50))` and
    `medium = max(2 * tiny, floor(max / 10))`
  - `borrow(game: Game, amount: number): void`
  - `payBack(game: Game, amount: number): void`
  - `toggleInsurance(game: Game): 'ok' | 'needsEscapePod'`
  Each function that changes the game calls `game.save()`.
- Produces: `scripts/compare-screens.mjs <row-id>`: loads
  `src/tests/fixtures/old-save.json` into `old/js/index.html` and into the
  dev server, opens the given landing row in both, screenshots the
  sub-content area and prints whether the two images are identical.

- [ ] **Step 1: Add a Node test project** to `vite.config.ts` for
  `src/game/**/*.test.ts`, beside the browser project for `src/tests/`.
  `pnpm test` runs both.

- [ ] **Step 2: Write failing tests** in `src/game/Store.test.ts`:
  a listener is called once per `changed()`; `version` goes up by one;
  an unsubscribed listener is not called.

- [ ] **Step 3: Implement `Store`.** Run the tests; expect PASS. If a
  rules module cannot be loaded in Node, move that test file to the
  browser project and say why in a comment in `vite.config.ts`.

- [ ] **Step 4: Write failing tests** in `src/game/Bank.test.ts`:
  `steps(1000)` is `{ tiny: 20, medium: 100, max: 1000 }`;
  `steps(40)` is `{ tiny: 5, medium: 10, max: 40 }`; borrowing more
  than `borrowable` borrows exactly `borrowable`; paying back more than
  the credits pays exactly the credits; `toggleInsurance` returns
  `'needsEscapePod'` and changes nothing without a pod, buys with a pod,
  and cancelling sets `noClaim` to 0.

- [ ] **Step 5: Implement `src/game/Bank.ts`** from the logic in
  `src/legacy-ui/BankViewController.ts`. Run; expect PASS.

- [ ] **Step 6: Add `record` and `register` to `ActionLogger`** and
  make its `register...EventListener` methods use them.

- [ ] **Step 7: Write the UI pieces:** `useStore`
  (`useSyncExternalStore` on `version`), `SessionContext`, `useLogged`,
  `LoggedButton`, `mountReact` (draws at once, returns a remover), and
  set `Store.flush` so a change reaches the page before `changed()`
  returns.

- [ ] **Step 8: Write `src/ui/Bank.tsx`** with the markup of the old
  screen (rows inside `<tbody>`), mount it from the landing screen's
  "Bank" row, remove it before the landing screen clears its content
  area, and delete `BankViewController.ts`.

- [ ] **Step 9: Replay checkboxes as clicks** in `ActionLogReplay`, and
  add a browser test in `src/tests/unit.test.ts`: replay
  `createCommander`, `Bank`, then `remindLoansCheckbox` with `change`;
  expect `game.remindLoans` to have flipped.

- [ ] **Step 10: Verify.**

  Run: `pnpm lint && pnpm build && pnpm test`
  Expected: PASS, baseline counts unchanged.
  Run: `node scripts/compare-screens.mjs Bank`
  Expected: `identical: true`.

- [ ] **Step 11: Commit.** `feat: bank screen in React, with shared pieces`

---

### Task 2: Alerts

**Files:**
- Create: `src/game/alerts.ts`, `src/game/alerts.test.ts`,
  `src/ui/AlertHost.tsx`
- Modify: every importer of `AlertViewController`,
  `src/game/EncounterController.ts`, `src/game/ActionLogger.ts`
- Delete: `src/legacy-ui/AlertViewController.ts`

**Interfaces:**
- Produces: `src/game/alerts.ts` as under "Shared interfaces".
- Produces: `AlertHost(): JSX.Element` drawing every alert in
  `alertStore.open` into `document.body`, oldest first, with ids
  `alertvc-backdrop<suffix>`, `alertvc-title<suffix>`,
  `alertvc-customView<suffix>` and button ids
  `sanitizedElementID("alertButton_" + suffix + title)`, where suffix is
  `"-" + alertID` or empty.
- Until Task 8, `AlertHost` is mounted once into a body-level element by
  the first `presentView()`.

- [ ] **Step 1: Write failing tests** in `src/game/alerts.test.ts`:
  - `press` runs handler, then removes the alert, then runs the
    completion step (record the order in an array).
  - An alert presented inside a handler is in `open` before the pressed
    one is removed, and remains after.
  - `currentAlertTitle()` is the title of the oldest open alert, and
    `undefined` when none is open.
  - `clearAlerts()` empties `open`.
  - `presentAlertWithDismiss` adds one alert with one "Dismiss" action
    whose handler is null.

- [ ] **Step 2: Implement `src/game/alerts.ts`.** Run; expect PASS.

- [ ] **Step 3: Write `AlertHost`** with the old classes:
  `alert-backdrop`, `alert-box` plus `alert-box-default` or
  `alert-box-high`, `two-buttons` for two or fewer actions and
  `more-buttons` otherwise, `destructive` on destructive buttons.

- [ ] **Step 4: Point every import at `src/game/alerts.ts`** and delete
  the old file. Remove the type-only `alertID?` note; it is real now.

- [ ] **Step 5: Trade slider as data.** In `EncounterController`,
  replace `customViewHandler` with
  `content = { kind: 'slider', id: 'tradeslider', min: 0, max, value }`
  and make "Selected" read `content.value`. `AlertHost` draws the range
  input and the value under it, and logs changes as the old
  `registerSliderEventListener` did.

- [ ] **Step 6: Replay sliders so React notices,** in
  `ActionLogReplay`: set the value through the native setter of
  `HTMLInputElement.prototype`, then dispatch a bubbling event of the
  recorded name.

- [ ] **Step 7: Run the suite.**

  Run: `pnpm test`
  Expected: PASS. If a test fails only because `clearAlerts` now clears
  everything, reproduce the old skip-every-second behaviour in
  `clearAlerts`, with a comment naming the test.

- [ ] **Step 8: Add a browser test** in `src/tests/unit.test.ts`: open
  two alerts without ids, each with a "Dismiss" action; press
  `#alertButton_Dismiss` once; expect the first alert's handler to have
  run and the second alert to remain.

- [ ] **Step 9: Verify and commit.**

  Run: `pnpm lint && pnpm build && pnpm test && pnpm test:stress`
  Expected: PASS.
  Commit: `feat: alerts as data, drawn by React`

---

### Tasks 3 to 5: Station screens

Each screen in these tasks follows the same cycle. One commit per
screen.

**The cycle for one screen:**

- [ ] Move the rules out of the old screen into a typed module in
  `src/game/`, with a `present()` function for anything the old screen
  did while drawing. Add plain tests for calculations that have limits
  or branches.
- [ ] Write the component in `src/ui/` with the old ids, classes and
  structure. It calls the rules and then redraws through the store.
- [ ] Mount it from the old parent with `mountReact`; delete the old
  screen file.
- [ ] Run `pnpm lint && pnpm build && pnpm test`. Expected: PASS,
  baseline unchanged.
- [ ] Run `node scripts/compare-screens.mjs <row-id>`. Expected:
  `identical: true`. Extend the script when a screen needs a step first
  (for example buying something so a sell row appears).
- [ ] Commit: `feat: <screen> in React`.

### Task 3: Cargo, equipment, ship yard

**Screens, in order:** buy/sell cargo, equipment, ship yard.

**Interfaces:**
- Produces: `src/ui/BuySellCargo.tsx` with props
  `{ game: Game, buy: boolean, baseSystem?: SolarSystem }`. Warp reuses
  it in Task 5 with `baseSystem`.
- Produces: `src/ui/ShipView.tsx` with props
  `{ ship: Ship, enemy: boolean, fade: boolean }`: the ship image with
  health and shield bars, ids `battle-hpContainer-<self|enemy>-<model
  name>` and `battle-hpBar-<self|enemy>`. Width is set in pixels from
  the measured container, visibility as a style. Task 6 reuses it.
- Produces: `src/game/ShipYard.ts` with `present(game: Game): void`
  holding the tribble warning and its flag.
- Notes: cargo button ids change with the label (`Sell` or `Dump`);
  two identical installed items share one `sell_...` id; `fulltank` is
  also used by warp.

### Task 4: Roster, news, commander status

**Screens, in order:** personnel roster, news, commander status with
the in-game hall of fame.

**Interfaces:**
- Produces: `src/game/News.ts` with a class `News` holding the cached
  text for one system, `present(game: Game): void` (the not-enough-money
  alert and the automatic purchase), `buy(game: Game): void` and
  `text(game: Game): string | null`. One instance lives as long as the
  landing screen, as the cached old screen did.
- Produces: `src/ui/HallOfFame.tsx` with props
  `{ game: Game, inProgress: boolean }`, reused by end game in Task 8.
- The roster row id `personnelRow-<name>` is not sanitised.

- [ ] **Extra step for news (Review Focus 1):** a browser test that
  opens the news under `<StrictMode>` with automatic purchase on, and
  expects the credits to have dropped by the price exactly once and the
  random generator's `_numInvocations` to equal the count from one
  `present` call.

### Task 5: Galaxy map, chart, warp

**Screens, in order:** the map component, galactic chart, warp.

**Files:**
- Create: `src/ui/canvas/GalaxyView.ts` (moved and typed),
  `src/ui/GalaxyMap.tsx`, `src/ui/GalacticChart.tsx`, `src/ui/Warp.tsx`,
  `src/game/Chart.ts`, `src/game/Warp.ts`

**Interfaces:**
- Produces: `GalaxyView.dispose(): void`, which stops the drawing loop
  and removes the resize listener.
- Produces: `GalaxyMap` with props `{ game: Game, zoomed: boolean,
  selected: SolarSystem | null, wormhole: boolean,
  onSelect: (system: SolarSystem, wormhole: boolean) => void,
  viewRef?: (view: GalaxyView | null) => void }`. It creates the
  `GalaxyView` when it appears and disposes of it when it goes.
- Produces: `src/game/Chart.ts` with `present(game: Game): void`, the
  in-place sort of `game.solarSystems` by name.
- Produces: `src/game/Warp.ts` with
  `systemsWithinRange(game: Game): SolarSystem[]` and
  `warp(game: Game, viaSingularity: boolean, destination: SolarSystem,
  begin: (origin: SolarSystem, destination: SolarSystem,
  wasVisited: boolean) => void): void`, the old `warpWithGame` with the
  same order of checks, alerts, changes and random draws.
- Until Task 6, the React warp screen hosts the old travel screen in a
  plain element it does not draw into.
- The chart button ids embed the table length:
  `galacticChart_track_<length>_<name>`.

- [ ] **Extra step (Review Focus 2):** a browser test that mounts and
  unmounts `GalaxyMap`, then checks that no further animation frame
  draws happen (spy on `drawGalaxy`) and that a `resize` event no longer
  reaches the view.

---

### Task 6: Travel, encounters, plunder

**Files:**
- Create: `src/game/Travel.ts`, `src/game/Plunder.ts`,
  `src/ui/Travel.tsx`, `src/ui/Encounter.tsx`,
  `src/ui/PlunderTable.tsx`, `src/ui/canvas/TravelProgressView.ts`
  (moved and typed, with `dispose()`), `src/ui/TravelProgress.tsx`
- Modify: `src/game/EncounterController.ts`, `src/ui/AlertHost.tsx`,
  `src/ui/Warp.tsx`
- Delete: `src/legacy-ui/TravelViewController.ts`,
  `EncounterViewController.ts`, `BattleOpponentView.ts`,
  `TravelProgressView.ts`, `PlunderViewController.ts`

**Interfaces:**
- Produces: `class Travel extends Store` in `src/game/Travel.ts`:
  - `constructor(game: Game, origin: SolarSystem,
    destination: SolarSystem, wasVisited: boolean,
    done: (result: 'arrived' | GameEndStatus) => void)`
  - `start(): void` — the old `presentView` followed by
    `_processEncounters`
  - `encounter: EncounterController | null`, `progress: number`
  - `perform(action: string): void`
  - the six `encounterController...` delegate methods, unchanged in name
    and arguments
  The travel loop, arrival and the escape pod are the old code with
  types added, in the same order.
- Produces: `class Plunder` in `src/game/Plunder.ts` with the old take,
  dump and littering rules, and `plundered: boolean`. The alert carries
  it as `{ kind: 'plunder', plunder }`; its alert id stays
  `<label>_<plunder|dump>`.
- `EncounterController.delegate` becomes `Travel | null`.
- Encounter buttons are links with ids
  `sanitizedElementID("ecButton_" + title)`. The encounter text is in
  `#eVC_dialog`.

- [ ] **Step 1:** Move the travel rules into `Travel` and the plunder
  rules into `Plunder`. Keep the old screens as thin callers for this
  step. Run `pnpm test`; expect PASS.
- [ ] **Step 2:** Write the components and delete the five old files.
  The opponent's ship view fades as before: the old one stays for 2000
  ms while the new one appears.
- [ ] **Step 3 (Review Focus 3):** a browser test with fake timers that
  starts an auto-attack outside a replay and advances 1500 ms twice;
  expect `#eVC_dialog` to change after each advance without a click.
- [ ] **Step 4:** Verify and commit.

  Run: `pnpm lint && pnpm build && pnpm test && pnpm test:stress`
  Expected: PASS.
  Commit: `feat: travel, encounters and plunder in React`

---

### Task 7: Landing screen and navigation

**Files:**
- Create: `src/ui/Landing.tsx`, `src/ui/NavLinks.tsx`
- Modify: `src/game/session.ts`, `src/legacy-ui/ViewController.ts`
- Delete: `src/legacy-ui/SystemLandingViewController.ts`

**Interfaces:**
- Produces, on `Session`:
  - `row: string | null`, `selection: { system: SolarSystem | null,
    wormhole: boolean }`, `travel: Travel | null`
  - `rows(): string[]` — the old `_tableRows`
  - `openRow(row: string): void` — the old `_handleRowClick`, including
    the warp row choosing a default destination and the special-event
    alert
  - `selectSystem(system: SolarSystem, wormhole: boolean): void`
  - `completeWarp(): void`, `endGame(status: GameEndStatus): void`
- Nav links are `<a id="<row name>">` with the names "Special", "News",
  "For Hire", "Buy", "Sell", "Equipment", "Warp", "Ship Yard", "Bank",
  "Roster", "Commander", "Chart"; the active one has class `active`.
- Element ids kept: `systemLandingOptionsDiv`, `subVCButtonsDiv`,
  `systemLandingSubContentDiv`, `system-info-welcome`,
  `system-info-text`. The options area is hidden during travel.

- [ ] **Step 1:** Write failing plain tests for `rows()`: "For Hire" is
  absent without a mercenary or when the mercenary is in the crew;
  "Special" is absent when the system has no special event.
- [ ] **Step 2:** Move the landing rules into `Session` and write the
  components. `mountReact` is no longer used by station screens.
- [ ] **Step 3:** Verify with the suite and
  `node scripts/compare-screens.mjs` for the landing screen. Commit.

---

### Task 8: New commander, end game, cheats, root

**Files:**
- Create: `src/game/NewCommander.ts`, `src/game/NewCommander.test.ts`,
  `src/ui/NewCommander.tsx`, `src/ui/EndGame.tsx`, `src/ui/Cheats.tsx`,
  `src/ui/Game.tsx`, `src/tests/support/SpaceTraderGame.ts`,
  `src/tests/support/ActionLogReplay.ts`
- Modify: `src/App.tsx`, `src/game/session.ts`,
  `src/game/ActionLogger.ts`, `src/game/Utilities.ts`,
  `src/tests/UnitTests.ts` (imports only), `src/tests/legacySuite.ts`,
  `src/tests/unit.test.ts`, `src/tests/app.test.tsx`
- Delete: `src/legacy-ui/ViewController.ts`, `main.ts`,
  `NewCommanderViewController.ts`, `EndGameViewController.ts`

**Interfaces:**
- Produces: `src/game/NewCommander.ts` with
  `spendPoints(skills: Record<'engineer' | 'pilot' | 'fighter' |
  'trader', number>, changed: string): { skills: ..., remaining: number }`,
  the old `updatePoints` including its clamp to the slider minimum.
- Produces, on `Session`: `screen: 'newCommander' | 'landing' | 'travel'
  | 'endGame'`, `start(): void`, `createCommander(name, difficulty,
  skills): void`, `continueAfterEnd(): void`,
  `highScores(count: number): GameState[]`, `clearHighScores(): void`.
  Saving and loading keep the storage keys `games` and
  `highScoringGames` and their shapes.
- Produces: `Game(props: { session: Session }): JSX.Element`, the whole
  game including `AlertHost`. `App` creates one `Session` and draws it.
- Produces: `Cheats(props: { session: Session })` with the old ids
  (`cheat_freeMoney`, `cheat_Encounter_Captain_Ahab`, …).
- Produces, in `src/tests/support/SpaceTraderGame.ts`, stand-ins with
  the names the recorded tests use:
  - `class SpaceTraderGame { constructor(gameDiv, loadGame?);
    main(): void; viewController: ViewController }`
  - `class ViewController { constructor(gameDiv, loadGame);
    presentView(): void; _game; _localStorage;
    _systemLandingViewController: { _galaxyView, _galaxyViewSystem,
    _galaxyViewWormhole, _tableRows() } }`
  `main()` mounts `Game` into `gameDiv` and `Cheats` into `#cheats`
  when debug mode is on.
- Element ids kept: `nameInput`, `difficultySelect`, the four skill
  sliders and their `...Val` spans, `pointsRemaining`,
  `createCommander`, `end-message`, `endgame`, `highscores`,
  `clearall`.

- [ ] **Step 1:** Write failing plain tests for `spendPoints`: raising
  one skill lowers the lowest other skill first; a total over 20 is
  brought back to 20; the minimum-of-one case returns the same numbers
  the old screen showed.
- [ ] **Step 2:** Replay dropdowns so React notices: after setting
  `selectedIndex`, dispatch a bubbling event of the recorded name. Add a
  browser test that replays `difficultySelect` with `select|change|3`
  and expects the created game's difficulty to be 3.
- [ ] **Step 3:** Move saving, loading and high scores into `Session`;
  write the components, the root and the stand-ins; move
  `ActionLogReplay` to the tests; change the imports in `UnitTests.ts`.
- [ ] **Step 4:** Delete the unused page helpers in `Utilities.ts`
  (`createElement`, `createBaysCreditsElement`, `installCheats`,
  `maintainScrollPosition`).
- [ ] **Step 5:** Verify. The saved-game test and the app test must
  pass (Review Focus 4). Commit.

---

### Task 9: Clean up and finish

**Files:**
- Delete: `src/legacy-ui/` (move `style.css` to `src/ui/`),
  `src/ui/mountReact.ts`
- Modify: `eslint.config.js`, `README.md`

- [ ] **Step 1:** Confirm nothing is left.

  Run: `ls src/legacy-ui; grep -rn "legacy-ui\|mountReact\|@ts-nocheck\|\[key: string\]: any" src --include='*.ts' --include='*.tsx' | grep -v "src/tests/UnitTests.ts"`
  Expected: no such directory, no matches.

- [ ] **Step 2:** Confirm the rules are free of the UI.

  Run: `grep -rnE "from '(react|react-dom|\.\./ui)" src/game`
  Expected: no output.

- [ ] **Step 3:** Remove `src/legacy-ui/**` from the relaxed lint
  override. `src/ui/` is linted with the normal rules.

- [ ] **Step 4:** Full verification.

  Run: `pnpm lint && pnpm build && pnpm test && pnpm test:stress`
  Expected: PASS, baseline counts from Task 0.

- [ ] **Step 5:** Play the production build by hand through
  `pnpm preview`: new commander, buy, warp, an encounter with
  auto-attack, arrival, news, chart, reload.

- [ ] **Step 6:** Update the README: layout table, and the roadmap now
  reads "screens are React; next, larger graphics".

- [ ] **Step 7:** Commit, push the branch and open the pull request
  with a description of what changed and why, any old bugs fixed, and
  what was left out.
