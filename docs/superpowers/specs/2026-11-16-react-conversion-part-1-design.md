# Space Trader: converting the screens to React, part 1

Date: 2026-11-16

## Intent

The goal of the whole project is a bigger, roomier game. The screens are
still the old hand-built page code. This work replaces them with React
components, one screen at a time, without changing how the game plays or
looks. Scaling up the graphics comes afterwards, as its own pass.

This replaces the earlier idea of a separate "step 1.5". Splitting every
old screen in two first would have meant writing page code that the React
rebuild then throws away. Each screen is now rewritten once.

Part 1 sets up the shared pieces and converts the first screen, the
bank.

## How the whole conversion goes

- **From the leaves inward.** Small screens first, each mounted inside
  the old screens that still surround it. The root flips to React last.
- **The recordings are the proof.** Every React component keeps the old
  element ids, so the existing recorded tests keep driving the game. The
  full suite passes after every pull request.
- **Rules leave the screens.** Game logic found inside a screen moves to
  `src/game/` as typed functions with plain tests that need no browser.
- **The look does not change** during the conversion. A changed
  screenshot or a failing test then always means a conversion mistake.

Planned order, one or two screens per pull request:

1. Shared pieces and the bank (this document).
2. Buy and sell cargo.
3. Equipment and ship yard.
4. Personnel roster, news, commander status.
5. Alerts.
6. Landing screen, galactic chart, warp.
7. Travel, encounters and plunder.
8. New commander, end game, and the root.

Each later part gets its own short design.

## Goals for part 1

- The bank screen is a React component, pixel-identical to the old one.
- The bank's rules live in `src/game/` with plain tests.
- The shared pieces the later parts need exist and are used by the bank.
- `pnpm lint`, `pnpm build`, `pnpm test` and `pnpm test:stress` pass.

## Non-goals

- Any other screen.
- Any change to the look or the wording.
- Alerts in React. The bank's one alert still uses the old alert code.
- A shared state store. See "Refreshing after a change" below.
- Rewriting the recorded tests.

## Anti-goals

- A change in game behaviour or in the order of random draws.
- Editing a recorded test to make it pass.

## What a trial already showed

A throwaway version of this exists on the local branch
`spike/bank-react`. It is a reference, not a starting point: write the
real version fresh.

- Recorded tests drive a React bank unchanged: all 157 tests and the 5
  stress tests pass.
- The React bank matches the old one pixel for pixel.
- A React screen can be mounted inside the old landing screen and removed
  when the player switches screen.
- A replayed checkbox change does not reach React. Replaying it as a real
  click fixes that, and every old screen still passes.

Sliders and dropdowns were not tried. The bank has none.

## Approaches considered

**A. From the leaves inward (chosen).** Described above. Small pull
requests, each proven by the full suite. Cost: mounting code sits in the
old screens until the end.

**B. From the root down.** React takes over the root and navigation
first and hosts the old screens. Cost: the first step rewrites the two
most tangled files with nothing smaller to learn from.

**C. Split every old screen into rules and a thin page view first.**
The original step 1.5. Cost: the thin views are thrown away when React
arrives.

A was picked because the trial proved it on a real screen and each step
is small enough to check.

## Design of part 1

### Layout

```
src/
  game/Bank.ts          the bank's rules
  game/Bank.test.ts     plain tests for them
  ui/Bank.tsx           the bank screen
  ui/LoggedButton.tsx   a button that records itself in the action log
  ui/useLogged.ts       the recording behind it, also used by checkboxes
  ui/useRefresh.ts      redraws a screen after the game changed
  ui/mountReact.ts      mounts a component inside an old screen
```

`src/legacy-ui/BankViewController.ts` is deleted.

### The bank's rules

`src/game/Bank.ts` holds what the old screen computed and changed:

- how much can be borrowed, and the small, medium and full amounts
  offered for borrowing and for paying back
- borrowing and paying back, with the same limits as today
- buying and cancelling insurance, including the refusal when there is
  no escape pod

Each function that changes the game saves it, as the old screen did. The
refusal is reported back to the caller, which shows the alert; the rules
do not open alerts.

### The action log

The old screens record every click through the action log, and the
stress tests choose their next step from what the log has registered. A
React button must do both.

`ActionLogger` gains one public method that records a step, replacing
the three lines each of its `register...` methods repeats. `useLogged`
registers the id when the element appears and records the step when it
is used.

### Mounting inside an old screen

`mountReact(container, element)` draws the component at once, so the
recorded tests can read the page on the next line, and returns a
function that removes it. The landing screen calls that function before
it clears its content area.

### Refreshing after a change

The game is one object that the rules change in place, so React does not
notice changes by itself. Each screen redraws itself with `useRefresh`
after it calls a rule. This is the smallest thing that works while React
screens are islands inside old ones. A shared store replaces it when the
root flips to React in part 8.

### Markup

The component produces the same elements, ids and classes as the old
screen, with two differences:

- Table rows sit inside a `<tbody>`, which React requires. Browsers
  treat the two the same.
- The old screen saved and restored the scroll position around each
  redraw, because it rebuilt the whole screen. React changes the page in
  place, so that is not needed.

### Replaying checkboxes

`ActionLogReplay` replays a checkbox change as a real click. This is the
only change to how recordings are replayed.

### Tests

- The recorded suite is unchanged and must stay at 153 tests and 3,064
  assertions, plus the tests added since.
- `src/game/Bank.test.ts` covers the amounts offered, the limits on
  borrowing and paying back, and the three insurance outcomes.
- Plain rules tests run in Node, as a second Vitest project next to the
  browser one. If the rules cannot be loaded in Node yet, they run in
  the browser project for now and the reason is written down.
- A new browser test replays a checkbox change on the bank and checks
  that the setting changed.
- A one-off screenshot comparison of the bank against `old/` confirms the
  look. It is a check during the work, not a permanent test.

### README

The roadmap section is updated: steps 1.5 and 2 become "convert the
screens to React one by one, then scale up the graphics".

## Left to the builder

- The exact names and shapes of the functions in `src/game/Bank.ts`.
- How the Vitest configuration expresses the two projects.
- The wording of the new tests.

## Decisions made by Claude, not yet confirmed by the owner

- The order of the eight parts.
- `useRefresh` now, a shared store in part 8.
- Plain rules tests in Node.
- React components go in `src/ui/`.
- Dropping the scroll-position handling for the bank.
