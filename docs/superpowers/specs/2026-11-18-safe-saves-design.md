# Space Trader: safe saving and loading

Date: 2026-11-18. Step 5 of the
[review roadmap](../plans/2026-11-18-review-roadmap.md).
Findings L1 to L5, Q11, X2 and X3 of
[the code review](../../code-review-2026-11-17.md).

## Intent

A player should never lose a game, or get stuck, because of what is in
the browser's storage. Today three things can go wrong:

- Storage that is full, blocked or damaged makes every save throw. A
  new commander cannot even be created.
- One saved game that cannot be loaded hides every game started after
  it.
- A saved game is believed without being checked, so a damaged one
  loads with empty or wrong values and fails much later.

## Goals

- Saving never throws out of a game action.
- A saved game that cannot be used is removed, and the player is told.
- A saved game is checked once, where it enters the game. Past that
  point the rest of the code can trust it.
- A damaged high-score record is skipped, not fatal.
- An error while drawing shows a message with a way out, not a blank
  page.

## Non-goals

- Removing the `Utils.ensure...` checks. This step makes that possible;
  doing it is separate work.
- Rebuilding the model classes or their constructors.
- Keeping several games side by side, or moving saves between devices.

## Anti-goals

- A check so strict that a valid game is thrown away.
- Telling the player nothing when a game is lost.

## Constraints

- There are no users, so the saved format may change freely.
- The test fixture `src/tests/fixtures/old-save.json` either keeps
  loading or is replaced by a fresh one in the same change.
- The rules stay free of page code. Storage is handed to the session,
  as today.

## What exists today

- `Session.read` parses storage with no guard. `save` and
  `addHighScore` call it on every action; only `loadIfNeeded` and
  `highScores` catch errors.
- `loadIfNeeded` tries the first saved game only, and leaves it in
  place when it fails.
- `Game.fromSerializedState` and its helpers copy fields with `|| 0`
  defaults and `!`. `Commander` reads its numbers through `parseInt`
  and a cast.
- A saved game has no version.
- `startSession` reads `localStorage` unguarded. There is no error
  boundary.

## Approaches to checking a saved game

**A. A schema library (recommended).** Describe the saved game once
with [valibot](https://valibot.dev), a small library made for this.
The check and the TypeScript types both come from that one description,
so they cannot drift apart. The five hand-kept `...State` types go
away. Cost: one new dependency of a few kilobytes.

**B. A hand-written check.** One function that walks the value and
tests each field's type. No dependency, but the `...State` types and
the check are two lists to keep in step, about 80 fields in five types.
That is the kind of drift this step is meant to end.

**C. Load, then look.** Wrap the existing loading in `try`/`catch` and
test a few facts about the result (the current system exists, the
numbers are finite). The least code, but it cannot see a field that
silently fell back to a default, which is the fault found in the
review.

A is recommended because the saved format has many fields and the
review found exactly the drift B invites. C is the fallback if a new
dependency is not wanted.

## Design

### Storage

A small module, `src/game/storage.ts`, is the only code that touches
the storage object:

- `readJson(key)` returns the parsed value, or nothing when the entry
  is missing or not valid JSON.
- `writeJson(key, value)` returns whether the write worked. It never
  throws.

The session uses these two and nothing else. `MockLocalStorage` moves
to the test support folder, and the session's storage is typed as
"something with `getItem` and `setItem`".

At start-up the page asks for `localStorage` inside a guard. If the
browser refuses, the session gets a storage that keeps things in memory
for this visit.

### When a write fails

The game goes on; it is still complete in memory. The first failed
write in a visit shows one alert:

> Your game cannot be saved in this browser right now. You can keep
> playing, but your progress will be lost when you close the page.

Later failures in the same visit are silent.

### Checking a saved game

`parseSavedGame(value)` takes whatever came out of storage and returns
a `GameState` or nothing. It is the one place a saved game is checked.

- The saved game gets a `version` number, starting at 1. A save without
  one is read as version 1, so today's saves and the fixture keep
  working. A save with a higher version than the code knows is refused.
- `fromSerializedState` and its helpers then take a checked
  `GameState`. Their `|| 0` defaults, the `parseInt` cast in
  `Commander`, and the `!` on looked-up systems are removed. A name
  that matches no system is a check failure, not a later crash.

### Loading

- Every saved game is tried, newest first, until one loads.
- Each one that fails the check, or throws while loading, is removed
  from storage.
- If any were removed, the player sees one alert after start-up:

> A saved game could not be read and was removed.

### High scores

Each record goes through the same check. A record that fails is left
out of the list and removed from storage. The commander screen no
longer rebuilds a full game for every record on every redraw: the five
values it shows are read from the checked record.

### When drawing fails

One error boundary around the game shows:

> Something went wrong. Reload the page to continue from your last
> saved game.

with a button that reloads. It also logs the error to the console.

### Tests

Written first, each failing before its fix:

- storage that throws on write: creating a commander works, and one
  alert is shown;
- unreadable JSON under `games`: the game starts at the new-commander
  screen and a commander can be created;
- a damaged first save followed by a good one: the good one loads, the
  damaged one is gone, and the player is told;
- a save with a missing field, a wrong type, an unknown system name,
  and a version from the future: each is refused;
- a damaged high-score record: the others are listed;
- the old-save fixture: loads, and its day count, credits, current
  system and one quest status are what the file says (today only the
  commander's name is checked);
- a component that throws: the message and the reload button appear.

## Left to the builder

- The exact valibot schema, and how the nested types are split.
- Whether "newest first" uses the saved date or the order in storage.
- The names of the new functions and files beyond those given here.

## Decisions made by Claude, not yet confirmed by the owner

- Approach A, with valibot as a new dependency.
- A save that cannot be used is deleted, not kept aside.
- A save without a version counts as version 1.
- The wording of the three messages.
- The page keeps working in memory when the browser refuses storage.
