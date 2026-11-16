# Space Trader: moving the old game into TypeScript (step 1)

Date: 2026-11-16

## Intent

The game in `old/` is plain JavaScript loaded through `<script>` tags. The
long-term goal is a bigger, less compact game: larger graphics and a roomier
layout, built in React. Step 1 prepares for that by getting the existing
game running inside the Vite + React + TypeScript project, with the game
rules properly typed.

The old screens will be rebuilt in step 2, so step 1 spends no effort on
typing them.

## The agreed order

1. **Step 1 (this document):** the same game, in TypeScript, proven by
   the existing tests.
2. **Step 1.5:** separate the rules from the alerts, then rewrite the
   tests to drive the rules directly, without a page.
3. **Step 2:** rebuild the screens in React.

## Goals

- The game plays in the new project exactly as it does in `old/`.
- The game rules, images and utilities are strictly typed TypeScript.
- The existing tests run from the command line and pass.
- `pnpm build`, `pnpm lint` and `pnpm test` all pass.

## Non-goals

- Rebuilding any screen as React components (step 2).
- Separating the rules from the old screens, and rewriting the tests as
  non-browser tests (step 1.5).
- Changing the look, the layout or the size of the graphics (step 2).
- Typing the old screen code.
- Offline support: the service worker, `manifest.json` and
  `generate-sw.sh` stay in `old/` for now.
- The standalone `cheats.html` page.
- Renaming files or classes, or tidying the code while moving it.

## Anti-goals

- Any change in game behaviour. Same seed, same actions, same result.
- Editing tests to make them pass. A failing test means the conversion
  broke something.

## What exists today

- 37 files, about 14,000 lines, plus `UnitTests.js` (7,900 lines, 153
  tests and 5 stress tests).
- Every file shares one global scope. There are no imports or exports.
- Five values are globals that the host page creates and reassigns:
  `gameRand`, `actionLog`, `stLocalStorage`, `debugMode` and
  `caughtError`. 31 files read them.
- The rules files (`SSSTGame`, `SSSTShip`, `SSSTCommander` and so on)
  barely touch the page. The `...ViewController` and `...View` files
  build the page by hand.
- The tests drive the game through the real page: they click through the
  view controllers, read text from elements and check pixel colours on a
  canvas. They need a real browser.
- Art is pixel art stored as text grids in `Images.js`, turned into PNGs
  by `PCEImage.js`.

## Approaches considered

**A. Rules typed strictly, screens carried over loosely (chosen).**
Rules, images and utilities become typed modules. The old screens come
along with type checking switched off and draw into one `<div>` hosted
by React. The game stays playable throughout. Cost: screen code stays
untyped until step 2 replaces it.

**B. Type everything strictly.** All 37 files fully typed. Cost: about
5,000 lines of careful typing on code that step 2 deletes.

**C. Port the rules only and rebuild the screens in React at once.**
Fastest route to the new look. Cost: nothing playable for a long time,
and the tests cannot run, because they drive the old screens.

A was picked because it keeps the tests usable as proof that nothing
changed, and wastes nothing on throwaway code.

## Design

### Layout

```
src/
  game/        rules, images, utilities - strictly typed
  legacy-ui/   old view controllers and views - type checking off
  tests/       the old test suite
  App.tsx      hosts the game in a single <div>
```

File and class names stay as they are (`SSSTShip.ts` and so on), so each
new file can be compared directly with its original in `old/`.

What goes where:

- `game/`: `GameRand`, `Utilities`, `SSSTActionLogger`, `SSSTGame`,
  `SSSTShip`, `SSSTCommander`, `SSSTCrewMember`, `SSSTOpponent`,
  `SSSTSolarSystem` and `_h`, `SSSTTradeItem` and `_h`, `SSSTPolitics`,
  `SSSTSpecialEventSpecifier`, `SSSTAccessory`,
  `SSSTEncounterController`, `PCEImage`, `Images`.
- `legacy-ui/`: every `...ViewController`, `SSSTGalaxyView`,
  `SSSTBattleOpponentView`, `SSSTTravelProgressView`, `main.js`,
  `style.css`.

Files in `game/` may import from `legacy-ui/` during step 1. Two rules
files lean on the screens heavily: `SSSTEncounterController.js` (36
references to view controllers) and `SSSTSpecialEventSpecifier.js` (15).
The alert buttons carry the game flow, so there is no clean part to lift
out. These files import the untyped alert and plunder classes as they
are. Untangling them is step 1.5.

### Shared values

The five globals become one module, `src/game/runtime.ts`, exporting a
single object that holds them. Code that read `gameRand` reads
`runtime.gameRand`. The host (`App.tsx` or the test setup) fills the
object in before starting the game, as the old pages did.

### Typing rules for `game/`

- Turn on `"strict": true` in `tsconfig.app.json`.
- The project forbids `enum`. The old constant objects (`SSSTTechLevel`
  and friends) stay as objects marked `as const`, with a type derived
  from each.
- No `any` in `game/` unless a comment says why.

### Carrying the screens over

- Each `legacy-ui/` file gets imports, exports and `// @ts-nocheck`.
- ESLint is relaxed for `src/legacy-ui/` and `src/tests/` so the
  `@ts-nocheck` comment and the old style do not fail the lint.
- `App.tsx` renders one `<div>`, and starts `SpaceTraderGame` in it once.
  The template content in `App.tsx`, `App.css` and `index.css` goes.

### Tests

- Vitest in browser mode, running headless Chromium through Playwright.
  A real browser is needed for the canvas and pixel checks.
- The old `UnitTests` class and its `assert...` helpers are kept. A small
  wrapper registers each `test...` method as one Vitest test, and does
  the clean-up that `unitTests.html` did between tests.
- Stress tests run under a separate command, as they did before.
- New dev dependencies: `vitest`, `@vitest/browser`, `playwright`.
- New script: `pnpm test`.
- The tests reassign `gameRand`, `actionLog` and `stLocalStorage`. Changing
  those lines to use `runtime` is part of the conversion and does not
  count as editing tests to make them pass.

### Order of work

1. **Baseline.** `old/unitTests.html` in headless Chrome gives 153 tests
   and 3,064 assertions, all passing. That is the target. The 5 stress
   tests have not been run yet; run them once and note the result.
2. **Move everything, types off.** All files become modules in their new
   folders with `// @ts-nocheck`. Wire up `App.tsx` and the test runner.
   Done when the game plays and the test counts match the baseline.
3. **Type the rules.** Remove `// @ts-nocheck` from one `game/` file at a
   time, starting with files that depend on nothing (`GameRand`, the
   `_h` files) and ending with `SSSTGame` and `SSSTEncounterController`.
   Tests pass after every file.
4. **Finish.** Build, lint and tests all pass. Play one game by hand.

### Version control

The folder is a new git repository with no remote. Work happens on the
branch `feature/typescript-conversion`, with one commit per stage in
stage 2 and one commit per file in stage 3, so every green test run is a
point to return to.

## Left to the builder

- How to break import cycles. The old files refer to each other freely.
  Six classes use `extends`, and those need their parent loaded first.
- The exact shape of the types.
- The Vitest wrapper and configuration details.

## Decisions made by Claude, not yet confirmed by the owner

- Vitest browser mode with Playwright as the test runner. The owner
  agreed to browser tests for step 1; the tool is Claude's pick.
- Keeping the `SSST` file and class names during step 1.
- Leaving offline support and `cheats.html` out of step 1.
- One `runtime` object in place of the five globals.
- No Makefile; `pnpm` scripts only.
