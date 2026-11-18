# Space Trader: rebuilding the model classes

Date: 2026-11-18. Findings G3, G4, G5 and G10, the `Utils.ensure`
leftover, and D4 of [the code review](../../code-review-2026-11-17.md).
It was left out of the review's roadmap as the largest piece; the
owner has asked for it.

## Intent

Six classes hold the state of a game: `Game`, `Commander`, `Ship`,
`SolarSystem`, `CrewMember` and `Opponent`. They are still close to
the Objective-C they were ported from:

- **Objects can exist half-built.** `new Game()`, `new Ship(15)` and
  `new SolarSystem()` return empty shells that a loader then fills in
  field by field. About 120 fields are declared with `declare`, which
  turns off the compiler's check that they are set, so the types
  cannot tell a built object from an empty one.
- **One value, up to four ways to reach it.** `getCredits()`,
  `setCredits()`, `get credits` and `set credits` all exist, and
  callers use all of them. Most setters silently drop a bad value.
- **Numbers where the game has named kinds.** About 70 fields and
  parameters are `number` where a type such as `ShipModelType` or
  `SpecialEvent` exists, which is why lookups need casts.
- **The difficulty is stored four times**, on the game, the commander,
  every ship and every system, with nothing keeping them equal.
- **About 300 runtime checks** (`ensureInteger` and friends) stand in
  for what the types should guarantee. Since saved games are checked
  where they enter (step 5), the checks are no longer needed.

| Class | Lines | `declare` fields | Accessors | Runtime checks |
|-------|-------|------------------|-----------|----------------|
| `Game` | 1,063 | 36 | 12 | 55 |
| `Commander` | 756 | 23 | 34 | 60 |
| `Ship` | 1,300 | 33 | 15 | 59 |
| `SolarSystem` | 631 | 16 | 26 | 38 |
| `CrewMember` | 173 | 9 | 2 | 12 |

## Goals

- An object is complete from the moment it exists. No `declare`
  fields; the compiler checks every field is set.
- One way to read a value and one way to change it.
- Fields and parameters use the game's named types.
- The difficulty is stored once.
- The runtime checks are gone from the rules.
- Nothing the game does changes.

## Non-goals

- Changing a rule, a text, a number or an element id.
- Changing the order in which random numbers are drawn.
- Splitting `Game.ts` or `Ship.ts` by topic. That can follow.

## Anti-goals

- A new galaxy that differs from today's for the same seed.
- A saved game that loads differently.

## Approaches

**A. Complete objects, built two ways (recommended).** Each class gets
a private constructor that takes every field, and two static
factories: `create(...)` for a new game, which draws its random
numbers exactly as today's constructor does, and `load(state)` for a
saved game, which takes the checked state. The classes stay; callers
change only where they used an accessor that goes away.

**B. Plain data and functions, no classes.** State as plain objects,
rules as functions over them. The most "TypeScript" result, but it
rewrites every rule and every caller at once, so every random draw is
at risk together. Too much in one move.

**C. Only remove the `declare` fields.** Give each field a starting
value and keep the rest. The least work, but the empty shells remain
and the types still cannot tell them from real objects.

A is recommended: it removes the empty shells, which is the root of
the other problems, without rewriting the rules.

## Design

### Constructing

```ts
class Ship {
  private constructor(fields: ShipFields) { ... }  // every field set
  static create(model: ShipModelType, rand: GameRand): Ship
  static load(state: ShipState, systems: SolarSystem[]): Ship
  toState(): ShipState                             // was serializedState()
}
```

- `create` keeps today's statements in today's order, so it draws the
  same numbers.
- `load` takes what `parseSavedGame` has already checked. The field by
  field copying into private fields from outside the class goes away.
- `Game` builds the galaxy in `create` and wires wormholes and the
  commander's current system in `load`, in the order it does today.

### Reading and changing values

- A value with no rule attached becomes a plain public field.
- A value with a rule (credits that may not go below zero, the current
  system that sets prices when it changes) keeps one getter and one
  method that says what it does, such as `moveTo(system)` in place of
  `setCurrentSystem`.
- The `getX()` and `setX()` methods go; callers are changed by script.

### Types

Fields and parameters get the named types that exist: `ShipModelType`,
`SpecialEvent`, `TechLevel`, `PoliticsType`, `GameEndStatus`,
`Difficulty`, and the quest statuses. The countdown statuses nested as
`DaysUntilInvasion._7` become flat values with small tests such as
`invasionUnderway(status)`; the stored numbers stay the same.

### The difficulty

It lives on `Game` only. The ship and the systems are given it where
they use it (skill adjustment, inventories). The three other copies are
dropped from the saved game. `SAVE_VERSION` becomes 2, and
`parseSavedGame` accepts version 1 by dropping the copies, so the test
fixture and any save still load.

### The runtime checks

`ensure.ts` is removed from the rules once the types carry the same
guarantees. Where a check guards input that the types cannot see, it
becomes an ordinary condition with a clear error. The replay's check
for a missing element, which uses one of them, becomes a plain error in
the test support code.

### The session's page state (G10)

The two counters that exist only to make React redraw, and the handle
to the map, move from the session to the components that own them.
Tests that reach the map through the session get a small helper in the
test support code instead.

### Fields the tests reach into

Tests read about 50 private fields (`_remainingRareEvents`, `_crew`,
`_cargo`, `_fuel`). Each gets a public way to read it, or the test uses
one that exists; nothing private is made public only for a test without
a reason the game would also accept.

## How "does the same" is checked

The guards from earlier steps, after every commit:

- the fingerprints of the twenty stress walks, which cover the complete
  saved game and the position of the random generator;
- all recorded games, and the per-file probe lists;
- a new test: for a fixed seed, `Game.create` produces a saved state
  byte for byte equal to today's, pinned before the work starts;
- the old-save fixture loads to the same values.

## Order of work

One stacked pull request per piece, smallest first, each green:

1. `CrewMember` and `Opponent`.
2. `SolarSystem`.
3. `Ship`.
4. `Commander`.
5. `Game`, including the saved-game version 2 and the difficulty.
6. The named types, and the flat quest statuses.
7. The runtime checks removed.
8. The session's page state.

Each starts with a commit that only adds the new way, then moves the
callers, then removes the old way.

## Left to the builder

- The exact names of the methods that replace setters with rules.
- Which values have a rule and which become plain fields, where the
  code is not clear; the rule wins when in doubt.

## Approved

The owner approved this design on 2026-11-18, with approach A and every
other proposal in it.
