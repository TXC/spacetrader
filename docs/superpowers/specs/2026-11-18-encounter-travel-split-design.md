# Space Trader: splitting the encounter and travel code

Date: 2026-11-18. Step 13 of the
[review roadmap](../plans/2026-11-18-review-roadmap.md).
Findings G1, G2 and G6, and the rest of D3, of
[the code review](../../code-review-2026-11-17.md).

## Intent

Three functions hold most of what happens between two systems:

| Function | Lines | What it does |
|----------|-------|--------------|
| `EncounterController.performAction` | about 800 | Thirteen actions in one chain of `if`s, chosen by the text on a button, with functions nested four deep |
| `EncounterController._executeAction` | about 320 | One round of a fight |
| `Travel._processEncounters` | about 630 | Who you meet, how they behave, and everything that happens on arrival |
| `Opponent.generateOpponentWithType` | about 370 | Builds an opponent: ship, equipment, cargo, crew |

None of them can be tested or read on its own. This step splits them
into small files, each with one job, without changing what the game
does.

## Goals

- One file per encounter action, behind one small shape.
- Travel reads as its steps: who is met, how each kind behaves, what
  happens on arrival.
- An opponent is built by a short list of named steps.
- The encounter no longer asserts 26 times that its owner exists.
- Functions of about 20 lines, as far as moving code allows.

## Non-goals

- Changing any rule, text, number or element id.
- Fixing rule bugs. Any found on the way are reported, not fixed here.
- Rebuilding the model classes (`Game`, `Ship`, `Commander`).
- New tests of single rules beyond what the split needs; those can
  follow once the pieces exist.

## Anti-goals

- A random number drawn in a different place or order. Recorded games
  replay from a seed, so one moved draw breaks about 150 tests.
- A "while I am here" improvement inside a move. A commit either moves
  code or changes it, never both.

## Constraints

- The names on the encounter buttons stay: element ids are built from
  them (`ecButton_Attack`), and recordings press them.
- Every `pLog.log(n)` stays at the same point in the flow. The tests
  check the set of probes each flow file reaches.
- The saved-game format does not change.

## Approaches for the actions

**A. A function per action, in a table keyed by the button's name
(recommended).**

```ts
type ActionName = 'Attack' | 'Flee' | 'Submit' | ...;
type EncounterAction = (encounter: Encounter) => void;

const ACTIONS: Record<ActionName, EncounterAction> = {
  Attack: attack,
  Flee: flee,
  ...
};
```

The compiler checks that every button has an action. An action is a
plain function that can be called in a test.

**B. An object per action, following an interface** with `name`,
`available(encounter)` and `perform(encounter)`. This would also move
"which buttons are offered" into each action. But the order of the
buttons matters and is decided per kind of encounter, so that logic
reads better in one place than spread over thirteen files.

**C. A class per action.** More ceremony than B for the same result,
and the project prefers composition.

## Design

### Folders

```
src/game/encounter/
  Encounter.ts        the class: its state, and performAction
  types.ts            the kinds of encounter and the tests on them
  buttons.ts          which buttons an encounter offers, in order
  text.ts             the sentence describing the encounter
  fight.ts            one round of a fight
  arrest.ts           being arrested
  scoop.ts            picking up a canister
  actions/
    index.ts          the table of actions
    attack.ts  flee.ts  ignore.ts  trade.ts  surrender.ts  bribe.ts
    submit.ts  plunder.ts  meet.ts  drink.ts  interrupt.ts
src/game/travel/
  Travel.ts           the class: the trip, its progress, its encounter
  whoIsMet.ts         the dice that pick a kind of opponent
  police.ts  pirates.ts  traders.ts  specialShips.ts  rareEvents.ts
                      how each kind behaves when met
  arrival.ts          the reactor, tribbles, repairs and purchases
  podEscape.ts        what an escape pod saves and loses
src/game/opponent/
  Opponent.ts         the class
  build.ts            the steps: ship, gadgets, weapons, shields,
                      cargo, crew, hull
```

`EncounterController` is renamed `Encounter`; "controller" is a
leftover from the screens it once drove.

### The actions

- `Auto-Attack` and `Auto-Flee` are entries in the table that switch
  the mode on and then run `attack` or `flee`. They live in those two
  files.
- `Surrender` and `Yield` share their code today and share one file.
  So do `Plunder` and `Board`.
- Today some branches of `performAction` end with an early `return`
  that skips the block at the bottom, which repeats an automatic
  action. Each action function keeps that exactly: it reports whether
  the common ending runs.

### The encounter and its owner

Today the encounter holds `delegate: Travel | null` and calls it
through `this.delegate!` in 26 places. It becomes a small interface
the trip implements, given to the encounter when it is made and never
empty:

```ts
type EncounterListener = {
  continues(fightGoesOn: boolean): void;
  plundered(anythingTaken: boolean): void;
  hullChanged(): void;
  buttonsChanged(): void;
  arrested(): void;
  destroyed(): void;
};
```

The long names from Objective-C
(`encounterControllerDidCompleteWithDestruction`) go.

### Types

`EncounterType` values and action names get real types where these
files pass them around, in place of `number` and `string`. No number
changes. A wrong action name then fails to compile.

### Travel

One pass over the trip stays a loop in `Travel.ts`, but its body
becomes calls: pick who is met, ask that kind how it behaves, start
the encounter or go on. Arrival becomes a list of steps, each a
function returning the alerts it wants shown.

### The opponent

`generateOpponentWithType` becomes a list of steps in `build.ts`. Each
step keeps its random draws, in the order they are made today.

### Dead code met on the way

Checks that can never be true or false (finding D3) are removed in
commits of their own, each with the reason it cannot happen.

## How "does the same" is checked

Before anything moves, one new guard is added: for each of the five
stress walks, a fingerprint of the complete game state at the end of
the walk. The walks press thousands of random buttons from fixed
seeds, fights included, so a single draw out of place changes the
fingerprint.

Then, after every commit:

- the fingerprints are unchanged;
- all recorded games replay;
- the set of probes each flow file reaches is unchanged;
- types and lint pass.

## Order of work

Three pull requests, stacked, so each can be read alone:

1. **The encounter.** Fingerprints first. Then the listener, the types
   file, one commit per action, the fight, arrest and scoop.
2. **Travel.** Who is met, each kind, arrival, the escape pod.
3. **The opponent.**

Within each: one commit per moved piece.

## Left to the builder

- The exact split of the fight into functions.
- File names inside the folders, where a better one fits.
- Whether a helper used by two actions lives in `Encounter.ts` or in a
  small file of its own.

## Approved

The owner approved this design on 2026-11-18, with every recommendation
in it: plain functions in a table, the rename to `Encounter`, and three
stacked pull requests.
