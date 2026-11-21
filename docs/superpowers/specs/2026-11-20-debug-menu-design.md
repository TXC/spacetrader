# Space Trader: the debug menu

Date: 2026-11-20.

## Intent

A tool for developing the game, not a feature for players. Today the
debug panel below the game always shows every cheat button, the action
log and a button to copy it. The panel grows a menu instead: cheats
appear only when asked for, and a new view shows the game's state while
playing, so a value can be checked without a debugger.

## Goals

- A ☰ button opens the menu. It shows only in debug mode: development
  builds, or an address ending in `?debug`. That is the same rule the
  debug panel follows today.
- The menu holds:
  - a **Cheats** checkbox, off at start, that shows the cheat buttons
    below the game;
  - a **Game state** checkbox, off at start, that shows the game's state
    below the game as a tree whose branches open and close;
  - the **Copy Action Log** button, moved here from the panel.

## Non-goals

- Anything players see. Without debug mode nothing changes.
- Searching the state, or editing values in it.
- Remembering the checkboxes after a reload.

## Anti-goals

- A new dependency. The tree is our own code.
- Breaking the recorded tests. They press cheat buttons by id through the
  `#cheats` element the test harness mounts, which this change leaves
  alone.

## Approaches

| Approach | Trade-off |
|---|---|
| **A. Own tree, built on the browser's `<details>`** (chosen) | No dependency, about 30 lines, looks like the rest of the game. No search. |
| B. `react-json-view-lite` | Works with React 19, closest to `@textea/json-viewer`. A dependency and its own styles for a dev-only view. |
| C. Formatted JSON in a scrolling box | About 3 lines. Nothing folds; a whole game is long. |

`@textea/json-viewer` itself was ruled out: it supports only React 17
and 18, and needs Material UI and Emotion.

The user picked A: the view is for development only, so a library is not
worth it, and switching to B later touches one component.

## Calls made while designing

These were not discussed; the user can overturn any of them.

- The menu opens with the browser's built-in `popover`, from a ☰ button in
  the top right corner of the page.
- The action log text stays below the game, where it is today; only its
  copy button moves.
- The tree shows what a save keeps (`game.toState()`). Objects and lists
  are branches, closed at start; numbers, text and true/false values show
  on their line. It redraws when the page redraws.
- Before a game exists, the Game state view says so instead of showing an
  empty tree.

## Left to the builder

- Names, styles and where in `src/ui/` the pieces live.
- Updating the debug panel test to tick **Cheats** before pressing a
  cheat, and adding a test for the tree.
