# Space Trader: converting the screens to React

Date: 2026-11-16

## Intent

The goal of the whole project is a bigger, roomier game. The screens are
still the old hand-built page code. This work replaces all of them with
React components, without changing how the game plays or looks. Scaling
up the graphics comes afterwards, as its own piece of work.

This replaces the earlier idea of a separate "step 1.5". Splitting every
old screen in two first would have meant writing page code that the React
rebuild then throws away. Each screen is now rewritten once.

The owner asked for the whole conversion in one pull request.

## Goals

- Every screen is a React component. `src/legacy-ui/` no longer exists.
- Game rules that lived inside screens live in `src/game/`, typed.
- No rules module builds screens or imports from `src/ui/`. Two named
  exceptions touch the page and are left alone: `PCEImage.ts`, which
  turns the pixel art into images off-screen, and `Utils` helpers that
  become unused and are deleted.
- The game looks and plays exactly as before.
- The recorded test suite still passes: the same 153 tests, replaying
  the same steps and expecting the same game results.
- `pnpm lint`, `pnpm build`, `pnpm test` and `pnpm test:stress` pass.

## Non-goals

- Any change to the look, the wording or the layout.
- Larger graphics.
- Rewriting the recorded tests as React-style flow tests. That comes
  later.
- Running the recorded suite without a browser.
- Removing the `Utils.ensure...` checks.
- A full debug panel. Only the cheat buttons are converted, because the
  recorded tests use them.
- Offline support (service worker, manifest).

## Anti-goals

- A change in game behaviour or in the order of random draws.
- Editing a recorded test to make it pass. Two kinds of edit are
  allowed in `src/tests/UnitTests.ts`: import paths, and the one-time
  rewrite of markup checks described under "Checking meaning, not
  markup". The recorded steps and the expected game results never
  change.
- Game rules that run while React draws. React may draw a component more
  than once, so a rule that runs during drawing would run twice.

## How the old code works today

Findings from reading all 21 screen files. They shape the design.

- **Screens call each other through "delegate" objects** and by looking
  elements up by id. The root screen owns saving, loading and high
  scores.
- **Rules are spread through the screens.** The travel screen holds the
  whole travel loop: which encounter happens, arrival, the escape pod.
  The warp screen holds the departure rules. News, the ship yard, the
  bank, plunder and the new-commander form hold rules too.
- **Some rules run while a screen draws.** Opening the news can spend
  money, save the game, clear the breaking news and draw random numbers.
  The ship yard sets a flag and opens an alert. The chart sorts the
  game's list of solar systems in place, which later changes the order
  of random draws elsewhere.
- **Alerts are opened from the rules** (49 places in `src/game/`) and
  their buttons continue the game. A button click runs its handler, then
  removes the alert, then runs an optional completion step. An alert
  opened inside a handler is on the page before the old one is removed.
- **Two alerts carry custom content:** the trade alert has a slider, and
  the plunder alert has a cargo table with its own buttons.
- **Auto-attack and auto-flee** repeat a round every 1.5 seconds in play,
  and immediately when a recording is replayed.
- **Two canvases:** the galaxy map and the travel progress bar. Each
  runs a drawing loop and listens for window resizes, and neither cleans
  up properly.
- **The recorded tests reach into screen objects**, for example
  `viewController._game` (139 times) and the landing screen's galaxy map
  (about 130 times). They also assert exact markup in a few places and
  read the width and visibility of the health bars.

## Approaches considered

**A. From the leaves inward (chosen).** Convert small screens first,
each mounted inside the old screens that still surround it; the root
flips to React last. The suite passes after every screen.

**B. From the root down.** React takes over the root first and hosts the
old screens. Cost: the first step rewrites the two most tangled files
with nothing smaller to learn from.

**C. Split every old screen into rules and a thin page view first.**
Cost: the thin views are thrown away when React arrives.

A was picked because a trial proved it on the bank screen, and each step
is small enough to check. The trial is on the local branch
`spike/bank-react`. It is a reference, not a starting point.

## Design

### Layout when finished

```
src/
  game/             rules; no page code, no React
    session.ts      the one object the screens talk to
    alerts.ts       open alerts, as data
    Travel.ts  Warp.ts  News.ts  Bank.ts  ...   rules moved out of screens
  ui/               React components and the stylesheet
    canvas/         the two canvas drawing classes
  tests/
    support/        stand-ins for the old screen objects the tests read
```

### The session

`src/game/session.ts` holds everything the old screens kept between
them:

- the current game, and saving, loading and high scores
- which screen is showing: new commander, landing (and which sub-screen),
  travel, or end game
- the system selected on the galaxy map
- the open alerts

Rules change the game in place, as they do now, and then tell the
session that something changed. The session has a change counter and a
list of listeners. React components read from the session through one
hook and redraw when the counter moves.

The session replaces the delegate objects. What used to be "tell my
delegate the warp completed" becomes a session method.

**Updates reach the page at once.** The recorded tests click and read the
page on the next line, and the replay looks up the next element
immediately. The session therefore pushes each change to React
synchronously. This must hold for changes that start outside a React
click as well, such as a replayed map selection.

### Rules never run while drawing

Each screen that used to do something while drawing gets a `present`
function in its rules module. The session calls it at exactly the
moments the old code called `presentView()`: when the screen is opened,
and again after each action that used to redraw it. The component only
shows the result.

This keeps the old behaviour, including its oddities:

- News: the not-enough-money alert, the automatic purchase, and creating
  the news text with its random draws. The text is cached per system,
  with the same rule as today, for as long as the landing screen lives.
- Ship yard: the tribble warning and its flag.
- Chart: the in-place sort of the game's solar systems.

### Alerts

`src/game/alerts.ts` keeps the open alerts as plain data: text, id,
buttons with their handlers, style, and optional content.

- The class the rules use today keeps its name and its methods, so the
  49 call sites in the rules do not change. Presenting an alert adds it
  to the list instead of building page elements.
- One React component draws every open alert, attached to the page body
  as today, with the same ids and classes.
- The click order is kept: handler, remove, completion step.
- The helpers the tests call, for the title of the oldest open alert and
  for clearing alerts, read from the list. Clearing removes all open
  alerts. The old code skipped every second one by accident; if a
  recorded test turns out to depend on that, the accident is reproduced
  and noted.

Custom content becomes data too:

- **Trade slider.** The alert carries the slider's range and value. The
  "Selected" button reads the value from the alert, not from the page.
- **Plunder.** The plunder rules (take, dump, the littering warning)
  move to `src/game/Plunder.ts`. The alert carries that object, and a
  React component draws its cargo table.

### Travel and encounters

The travel loop, arrival and the escape pod move from the travel screen
to `src/game/Travel.ts`, as the same code with types added. The departure
rules move from the warp screen to `src/game/Warp.ts`.

`EncounterController` keeps its delegate. The delegate is now the travel
rules object, not a screen. Its only other changes are the two custom
alerts above. Auto-attack and auto-flee stay as they are.

### Canvases

The galaxy map and the travel progress bar keep their drawing code as
classes, typed and moved to `src/ui/canvas/`. Rewriting canvas drawing
in React would add nothing.

Each gets a small React component that creates the drawing object when
it appears and disposes of it when it goes. Disposal is new: it stops
the drawing loop and removes the resize listener.

The map keeps recording and replaying selections through the action log
under the same names.

### Markup and ids

Every component produces the same ids and classes as the old screen,
including the odd ones: ids with spaces, duplicate ids for two identical
installed items, and ids that embed a table length.

Where the old code produced unusual structure that the stylesheet
depends on, the component reproduces it. Where React needs something
the old code lacked, such as `<tbody>`, it is added.

Health and shield bars keep setting their width in pixels from the
measured container, and their visibility as a style, because tests read
both. The fading between opponents keeps its timing.

`src/legacy-ui/style.css` moves to `src/ui/` unchanged.

### The action log

A React button records its click in the action log and registers its id
when it appears, as the old `register...` calls did. One shared hook
does this for buttons, links, checkboxes, sliders and dropdowns.

`ActionLogger` gains one public method that records a step.

### Replaying recordings

Three changes, all in `ActionLogReplay`, none in the recordings:

- A checkbox change is replayed as a real click. The trial proved this.
- A slider value is set in a way React notices, followed by an event
  that reaches React.
- A dropdown choice is followed by an event that reaches React.

The last two are not proven yet. They are tried early: see "Order of
work".

`ActionLogReplay` clicks page elements, and only the tests use it. It
moves from `src/game/` to `src/tests/support/`.

### Cheats

The cheat buttons become a React component with the same ids. It is
shown when debug mode is on, in the `#cheats` element when one exists.

### What the tests read

The recorded tests read properties of the old screen objects. Small
stand-ins in `src/tests/support/` provide those names on top of the
session:

- `SpaceTraderGame` with `main()` and `viewController`
- `viewController._game`, `._localStorage`, `.presentView()`
- `viewController._systemLandingViewController` with `_galaxyView` (the
  map's drawing object), `_galaxyViewSystem`, `_galaxyViewWormhole` and
  `_tableRows()`

Only the import lines of `src/tests/UnitTests.ts` change.

### Checking meaning, not markup

About 100 checks in the recorded tests compare raw markup: the
encounter text with its `<br>` tags (68 of them), the news, the special
cargo and quest lists, plunder table cells, a roster row, the repair
panel, the chart's selected row and the hall of fame.

The owner's decision: these should check what the player sees, not how
it is built. Is the heading there, is the text the same, does the row
show the right number, is the checkbox there with its label.

They are rewritten once, before any screen is converted:

- Text checks compare the visible text, with line breaks as line
  breaks.
- Structure checks look for the element and its content: a heading with
  the masthead, a cell with the quantity, a button with its label.
- A few small helpers in `src/tests/support/` keep the rewritten checks
  short and uniform.

The rewrite is its own commit and must pass against the old screens.
That proves the new checks describe today's game before React has to
meet them. The number of assertions is counted again after that commit,
and the new count is the baseline for the rest of the work.

Checks on the health bars stay as they are: whether a bar is hidden and
whether its width changed are already about what the player sees.

### New tests

The recordings remain the proof for whole flows. New plain tests cover
what they do not reach directly:

- the alert list: click order, stacking, the oldest-title helper
- the session: opening screens, and that a change reaches listeners
- the bank's amounts and limits, and the three insurance outcomes
- the new-commander point budget, including the case where the display
  and the sliders disagree today
- one browser test each for a replayed checkbox, slider and dropdown

Plain tests run in Node as a second Vitest project. If a rules module
cannot be loaded in Node, its tests run in the browser project and the
reason is written down.

For each screen, a one-off screenshot comparison against `old/` confirms
the look. These are checks during the work, not permanent tests.

### Order of work

One pull request, many commits. The full suite passes after each step.
Until a screen's parent is converted, the React screen is mounted inside
the old parent, as in the trial. The reverse also happens: warp is
converted before travel, so for one step a React screen hosts an old
one in a plain element it does not draw into.

0. Rewrite the markup checks in the recorded tests, against the old
   screens.
1. Shared pieces, the session with nothing in it yet, and the bank.
2. Alerts, including the trade slider. This also proves the slider
   replay early.
3. Buy and sell cargo; equipment; ship yard.
4. Personnel roster; news; commander status and the hall of fame.
5. The galaxy map component, the chart, and warp with its rules.
6. Travel, encounters and plunder.
7. Landing screen and navigation.
8. New commander (proves the dropdown replay), end game, cheats, and
   the root. Saving, loading and high scores move to the session.
9. Remove `src/legacy-ui/` and the mounting helper. Update the README.

Alerts moved from fifth to second compared with the first draft of this
document, because every later screen opens alerts.

## Constraints

- React 19, TypeScript in strict mode, no new runtime dependencies.
- No `enum`; no `any` in `src/game/` or `src/ui/` without a reason.
- Functions stay short. A component that grows past about 20 lines is
  split.
- The app keeps `StrictMode`.

## Known risks

- **Slider and dropdown replay** is unproven. Tried in steps 2 and 8.
- **Stress tests pick their next step from the order in which ids were
  registered.** That order will differ under React, so the stress tests
  will take different paths. They have no fixed expected result; they
  only check that the game survives.
- **Old bugs on new paths.** A stress test on a new path may hit a
  crash that already exists in the old rules. The rule for that case:
  confirm the crash also happens in `old/`, fix it in its own commit
  with a test, and list it in the pull request. The owner confirmed
  this. It is the one case where game behaviour may change. A crash
  that does not happen in `old/` is a conversion mistake and is fixed as
  such.
- **Size.** About 4,500 lines of screen code are replaced in one pull
  request.

## Left to the builder

- Names and shapes of the functions in the new rules modules.
- How components are split into files.
- How the two Vitest projects are configured.
- How the session delivers changes synchronously.

## Decisions made by Claude, not yet confirmed by the owner

- A single session object, read through one hook, with no state library.
- Alerts keep their class name and methods; only the insides change.
- The canvas drawing stays as classes wrapped by components.
- Stand-ins for the old screen objects live with the tests, so the
  recorded tests stay untouched.
- Clearing alerts removes all of them, unless a test needs the old
  accident.
- Only the cheat buttons are converted, not the full debug panel.
- Alerts moved to second in the order of work.
- `ActionLogReplay` moves to the tests; `PCEImage.ts` stays in
  `src/game/`.
