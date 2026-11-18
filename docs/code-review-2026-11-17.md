# Space Trader: code review of `src/`

Date: 2026-11-17. Reviewed at commit `5bfe204` on `main`.

This document lists what a full read of `src/` found, so you can decide
what to fix, what to leave, and in which order. Nothing in the code was
changed.

## How to read this

- **Section 1** is the short verdict.
- **Section 2** is the decision list: the findings grouped into pieces
  of work, each sized as one pull request. Tick what you want.
- **Sections 3 to 9** hold the findings behind each piece of work.
- **Section 10** lists what is in good shape.
- **Section 11** says what was not checked.

Every finding has an id (`B1`, `S3`, ...) that the decision list refers
to. Three columns recur in the tables:

- **Checked** says who confirmed the finding. "Yes" means I read the
  code myself after the first reviewer reported it. "Reviewer" means one
  reviewer read it and quoted the code, and I did not re-read it.
- **Replays** says whether a fix changes how recorded games play out.
  "Diverge" means recordings that walk that path would end differently
  and need to be re-recorded or adjusted. "No" means they are safe.
- **Effort** is small (under an hour), medium (half a day) or large
  (more than a day).

### How the review was done

Five reviewers each read one area completely: the encounter and travel
rules, the core game model, the session and the smaller rules, the
screens with the offline code, and the tests with the tooling. The large
generated flow tests (about 8,000 lines) were sampled, not read line by
line. I then re-read the code behind the most serious findings.

## 1. Verdict

The game works and is well covered along the paths the recorded games
walk. The React layer, the small rules modules and the table modules are
in good shape. Three things stand out:

1. **There are real rule bugs**, eleven confirmed. Most sit in paths no
   recording walks: dumping or plundering more than fits, selling a
   shield, an arrest with a good record. Only three of them exist in the
   original Palm game; the rest came in with the JavaScript version or
   later (see "Compared with the original game" in section 3).
2. **Saving and loading is fragile.** Storage that is full, blocked or
   damaged can leave a player stuck, and a saved game is trusted without
   any check.
3. **The four biggest rules files are still the old code with types
   added.** `EncounterController.ts`, `Travel.ts`, `Game.ts` and
   `Ship.ts` carry one 880-line function, one 630-line function, about
   95 fields the compiler cannot check, and many leftovers from C and
   Objective-C.

## 2. Decision list

Each row is one possible pull request. They are ordered by value for
effort, highest first. "Replays" is the worst case among its findings.

| Do it? | # | Piece of work | Findings | Effort | Replays |
|--------|---|---------------|----------|--------|---------|
| [ ] | P1 | Make saving and loading safe | L1 to L5 | medium | No |
| [ ] | P2 | Fix the confirmed rule bugs that cannot change recordings | B1, B2, B3, B4, B5, B7, B10, B11 | medium | No, see note |
| [ ] | P3 | Decide and fix the rule bugs that do change recordings | B6, B8, B9 | small | Diverge |
| [ ] | P4 | Fix the departures from the original game (all but Q6) | Q1 to Q12 | small each | Mostly diverge |
| [ ] | P5 | Tooling clean-up: CI filter, check script, release config, lint | T1 to T9 | small | No |
| [ ] | P6 | Accessibility of alerts, buttons, images and inputs | A1 to A8 | medium | No, see note |
| [ ] | P7 | Delete dead code and leftovers | D1 to D7 | small | No |
| [ ] | P8 | Offline: clear old files, stop re-downloading | O1 to O4 | medium | No |
| [ ] | P9 | Canvases: draw only when something changes | C1 to C5 | medium | No |
| [ ] | P10 | Stylesheet clean-up and dark mode gaps | Y1 to Y6 | small | No |
| [ ] | P11 | Tests: probes, harness leaks, duplicated tests, recordings | X1 to X13 | medium to large | No |
| [ ] | P12 | TypeScript idioms, the cheap ones | I1 to I9 | medium | No |
| [ ] | P13 | Split the two giant functions | G1, G2 | large | No, if order is kept |
| [ ] | P14 | Rebuild the model classes (constructors, fields, accessors) | G3 to G6 | large | No, if order is kept |
| [ ] | P15 | Untangle the session from the rules | G7 to G10 | medium | No |

Notes:

- **P2:** these fixes change behaviour only where the game is wrong
  today. A recording that happens to walk such a path would diverge; the
  reviewers found none that does, but only running the tests will prove
  it.
- **P6:** changing a link into a button keeps its id. The flow tests and
  a few style rules must be checked for reliance on the `<a>` tag.
- **P13 and P14** are safe only as pure moves: the same statements in
  the same order, so the random numbers are drawn in the same order.

My recommendation is P1, P2 and P5 first. They remove the ways a player
can lose a game or get stuck, and they are cheap. P3 and P4 need your
decision on the rules more than they need work.

### Decisions so far

| Date | Finding | Decision | Note |
|------|---------|----------|------|
| 2026-11-18 | B8 | Fix | The test `ionReactor_tooLate_escapePod` walks this path, so its expected values will change with the fix. |
| 2026-11-18 | B5 | Fix | Treat a good record as zero, which gives the minimum fine of 500. |
| 2026-11-18 | B10 | Fix | One shared "is it safe to submit" check for Attack, Flee and Bribe. |
| 2026-11-18 | A1 | Fix | Alerts become modal dialogs that take the focus off the page. |
| 2026-11-18 | G1, G2 | Do, shape open | Owner suggests a folder of actions, one file each, behind an interface. |
| 2026-11-18 | Y1 to Y6 | Do, as CSS Modules | Possibly with `composes`. |
| 2026-11-18 | T2 | Done by owner | `.releaserc.json` is fixed. The release job stays commented out until there is a host. |
| 2026-11-18 | T5 | Fix | Remove the lint exceptions for tests. |
| 2026-11-18 | T6 | Do | Generate `sw.js` from TypeScript. |
| 2026-11-18 | T7 | Fix | Enable `eslint-config-prettier`, remove `eslint-plugin-prettier`. Claude's proposal, not contradicted. |
| 2026-11-18 | Q5 | Fix | Changes most recordings with a fight in them. Done last, after counting the tests it breaks. |
| 2026-11-18 | Q7 | Fix | Changes every new galaxy. Done last, after counting the tests it breaks. |
| 2026-11-18 | L3, L4 | Free to change the saved format | There are no users, so no saved game has to keep loading. |
| 2026-11-18 | T6, O1 | `vite-plugin-pwa` may be used | If it works with this Vite version; otherwise our own build step. |
| 2026-11-18 | All | Stacked pull requests | Order in `docs/superpowers/plans/2026-11-18-review-roadmap.md`. |
| 2026-11-18 | Q7 | Fix, with a generator of his own | Extending the placement loop breaks 117 tests; a separate generator for Yorvick breaks none. The original game does the same for its newspaper. |
| 2026-11-18 | Q5 | Fix the damage roll, last | Only the damage roll matters: it breaks 19 tests from about eight recordings. The tribble roll breaks none. The repair roll already gives the original's result and is not a bug. |

## 3. Rule bugs

### Confirmed

| Id | What goes wrong | Where | Checked | Replays | Effort |
|----|-----------------|-------|---------|---------|--------|
| B1 | Dumping cargo you cannot afford to dump removes all of it but charges only for the part you can pay. With no credits, everything is dumped for free. | `Commander.ts:615-639` | Yes | No, see P2 note | small |
| B2 | Plundering can create or destroy cargo. "5" when the victim has 2 gives you 5. "All" with too few free bays deletes what did not fit. | `Plunder.ts:96-102` | Yes | No | small |
| B3 | Selling a shield, or trading one to Captain Conrad, does not lower the ship's current shield power. It can end up above what the remaining shields hold. | `Ship.ts:824-844` | Yes | No | small |
| B4 | When your debt stops you leaving and Jonathan Wild also refuses, the debt message shows Wild's buttons. "He can stay!" throws him out, and you still cannot leave. | `Warp.ts:54-75, 146-148` | Yes | No | small |
| B5 | An arrest fine is negative when the police record is good, which pays the player. Reachable by submitting to an inspection with Wild aboard. | `EncounterController.ts:1903-1911` | Yes | No | small |
| B6 | "Ignore trade in orbit" hides every trader encounter, not only trade offers. Inherited from the old game. | `Travel.ts:412-418` | Yes | Diverge | small |
| B7 | "Pay to read" the news charges you even when you cannot afford it, so credits go negative. Inherited. | `News.ts:83-95` | Yes | No, see P2 note | small |
| B8 | A reactor explosion with an escape pod runs the arrival step twice, so markets and system events advance one step too many. | `Travel.ts:560, 874` | Yes | Diverge | small |
| B9 | The random generator can return one more than its maximum, about once in four billion calls. The next lookup then fails. | `GameRand.ts:30-31` | Yes | No, if clamped | small |
| B10 | At an inspection, Attack says "it should be safe to submit" although Wild or the reactor is aboard. Flee and Bribe check correctly. | `EncounterController.ts:608-614` | Reviewer | No | small |
| B11 | Two buttons can get the same id: the bank's step buttons when two amounts are equal, the sell buttons of two identical items, and the hull bars while an opponent fades. A click or a replay then hits only the first. | `Bank.tsx:48-49`, `Equipment.tsx:42`, `ShipView.tsx:42-47` | Reviewer | No | small |

For B9, the fix must clamp the result. Changing the divisor would shift
other results and break every recording.

### Possible, to decide against the original game

The reviewers could not see the original source, so these were reported
as "possible". They have since been compared with the Palm source; the
result for each is in the next table.

| Id | What looks wrong | Where | Replays | Effort |
|----|------------------|-------|---------|--------|
| Q1 | With the reactor aboard, submitting to an inspection skips the checks for narcotics, firearms and Wild. | `EncounterController.ts:1053-1075` | No | small |
| Q2 | Tribbles that eat narcotics grow in number, while the message says they died. | `Travel.ts:656` | Diverge | small |
| Q3 | Pirates always take one item, even with a full hold. | `EncounterController.ts:915-926` | Diverge | small |
| Q4 | Trading in orbit ignores what the trader carries: you can buy 30 from a trader with 2. | `EncounterController.ts:738-739` | No | small |
| Q5 | Fractions are passed to the random generator where the original divided whole numbers, so some rolls reach one value higher. | `Travel.ts:130, 684`; `EncounterController.ts:1847, 1857` | Diverge | small |
| Q6 | The weighted pick of an opponent's ship gives the first ship one chance too many. | `Opponent.ts:180-194` | Diverge | small |
| Q7 | The last mercenary name, "Yorvick", is never placed in the galaxy. | `Game.ts:625` | Diverge if placed | small |
| Q8 | The largest loan has no lower or upper limit. A clean record worth under 5,000 can borrow nothing, less than a criminal. | `Commander.ts:550-557` | Diverge | small |
| Q9 | News headlines are reused when you return to a system without having read the news elsewhere. Inherited. | `News.ts:117-119` | Diverge | small |
| Q10 | The Japori antidote disappears when you buy a new ship, freeing ten bays. Delivery still succeeds. Inherited. | `ShipYard.ts:182-194` | No | small |
| Q11 | A damaged high-score record makes the commander screen fail to draw. | `HallOfFame.ts:44-55` | No | small |
| Q12 | The alert box cannot scroll. A long plunder list on a short phone screen may push the buttons out of reach. | `style.css:499-519` | No | small |

### Compared with the original game

Added 2026-11-18. Each rule finding was compared with the Palm source,
version 1.2.2 (`old/SpaceTraderSource_1.2.2.zip`). "In the original?"
answers whether the original game has the same fault.

| Id | In the original? | What the original does | Original file |
|----|------------------|------------------------|---------------|
| B1 | No | Removes only the amount that is paid for. | `Cargo.c:939-949` |
| B2 | No | Takes the smallest of the amount asked, what the victim holds, and your free bays, and moves exactly that. | `Cargo.c:803-807` |
| B3 | No | Keeps a strength per shield and removes the sold shield's strength with it. | `SellEquipEvent.c:86-89` |
| B4 | No | Asks about Wild first, in its own alert, and checks the debt after that, in another. | `Traveler.c:484-505` |
| B5 | **Yes** | The same formula, so the fine is negative for a good record there too. | `Encounter.c:666` |
| B6 | No | Skips only trader buy and sell offers when the option is on. | `Traveler.c:2091-2096` |
| B7 | No | Refuses with "can't afford" and takes no money. | `SystemInfoEvent.c:399-403` |
| B8 | **Yes** | Runs arrival, then the escape pod runs arrival again. | `Traveler.c:2232, 2249`; `Encounter.c:592` |
| B9 | Not comparable | Uses another generator, with a remainder, which cannot overshoot. | `Math.c:85-88` |
| B10 | **Yes** | The same check: only firearms and narcotics. | `Encounter.c:1484-1489` |
| B11 | Not comparable | Element ids belong to the web version. | |
| Q1 | No | Fines for contraband, arrests for Wild, and also confiscates the reactor. The port stops after the reactor. | `Encounter.c:2079-2132` |
| Q2 | No | Sets the tribbles to 1 to 3. The port adds to them. | `Traveler.c:2284` |
| Q3 | No | Loops only while the pirate has free bays, so takes nothing with a full hold. | `Encounter.c:1937` |
| Q4 | No | Limits a purchase to what the trader carries, and a sale to the trader's bays. | `Encounter.c:1787-1794, 1708` |
| Q5 | No | Works in whole numbers. In-flight repairs are a roll up to the skill, then halved; the port rolls up to half the skill. | `Traveler.c:1780`; `Encounter.c:821` |
| Q6 | **Yes** | Picks the first ship whose running total reaches the roll, as the port does. | `Traveler.c:918-928` |
| Q7 | No | Places every mercenary, Yorvick included. Only Zeethibal is held back. | `Traveler.c:1450-1481` |
| Q8 | No | Limits a loan to between 1,000 and 25,000. | `Bank.c:40-44` |
| Q9 | No | Makes the news from the system and the day, so a later visit gets new headlines. | `SystemInfoEvent.c:465` |
| Q10 | No | Counts the antidote's ten bays from the quest's state, so a new ship still carries it. | `Cargo.c:1025-1026` |
| Q11, Q12 | Not comparable | Storage and alert layout belong to the web version. | |

What this changes:

- **Three confirmed bugs are the original's own:** B5, B8 and B10. They
  are still wrong (a negative fine pays the player), so fixing them is a
  choice to improve on the original.
- **Q6 is faithful to the original.** Leave it.
- **Every other finding is a departure from the original,** made by the
  JavaScript version or later. That settles the "possible" ones: Q1 to
  Q5 and Q7 to Q10 are bugs in the port, not rules to debate.
- **B6 and B7** were described above as "inherited". They are inherited
  from the JavaScript version, not from the original, which has both
  right.

The cost of fixing has not changed. Q2, Q3, Q5, Q7, Q8 and Q9 still make
recordings diverge, and Q7 would also change every new galaxy. For Q5
and Q7 I would still leave the behaviour and add a comment, because
every recording would change. Q2, Q3, Q8 and Q9 change only the games
that walk those paths.

## 4. Saving and loading

| Id | Finding | Where | Checked | Effort |
|----|---------|-------|---------|--------|
| L1 | Saving is not guarded. If storage is full, blocked or holds damaged data, the error escapes from every action that saves. Creating a commander fails before the game starts, so the player is stuck on that screen. | `session.ts:138-167` | Yes | small |
| L2 | Only the first saved game is tried. If it cannot be loaded it stays first, so a newly started game is never loaded on the next visit, and each restart adds another orphan. | `session.ts:142-154` | Yes | small |
| L3 | A saved game is trusted without any check. Missing or wrong fields become `undefined`, `NaN` or a silent default (a missing ship type becomes a Flea) and fail much later. | `Game.ts:191-257`, `Commander.ts:195-241`, `Ship.ts:539-608`, `SolarSystem.ts:243-276` | Reviewer | medium |
| L4 | Saved games carry no format version, so an old save cannot be told from a damaged one. | `Game.ts` (`GameState`) | Reviewer | small |
| L5 | The page reads `localStorage` at start-up without a guard, and there is no error boundary. Blocked storage or any error while drawing leaves a blank page. | `startSession.ts:20`, `App.tsx` | Reviewer | small |

L3 is the piece that would let the roughly 290 `Utils.ensure...` checks
go: check the shape once, where a save enters the game, and trust it
after that. Adding a version (L4) changes the saved format, so existing
saves need a default.

## 5. Not the TypeScript way

### Cheap to fix

| Id | Finding | Where | Effort |
|----|---------|-------|--------|
| I1 | Upper-case function names left from C macros: `POLICE_RECORD_STR`, `REPUTATION_STR`, `ADJUST_SKILL_FOR_DIFFICULTY`, `ACCESSORY_FOR_TYPE`, `ENCOUNTER_FLEE`, `BEST_ROLL` and others. About 20. | `Commander.ts`, `SolarSystem.types.ts`, `Accessory.ts`, `EncounterController.ts`, `Opponent.ts` | small |
| I2 | `==` and `!=` where `===` is meant: 23 places. | `Utilities.ts` (11), `PCEImage.ts` (7), five others | small |
| I3 | Objective-C names for callbacks: `_saveBlock`, `shouldHideBlock`, `delegate`, `encounterControllerDidCompleteWith...`. | `Game.ts`, `SpecialEventSpecifier.ts`, `EncounterController.ts`, `Travel.ts` | small |
| I4 | Loops with a counter or `forEach` plus a `let`, where `find`, `filter`, `some` or `reduce` say it in one line. About 15. | `Game.ts`, `Ship.ts`, `Commander.ts`, `SolarSystem.ts` | small |
| I5 | Functions that return a number on one path and nothing on another. `damageShieldsByAmount` can feed `undefined` into arithmetic. | `Ship.ts:946-982`, `Commander.ts:655-687` | small |
| I6 | Screen names and end statuses are plain `string` and `number`. A typo such as `openRow('Shipyard')` compiles and does nothing. | `session.ts:22-50, 115` | small |
| I7 | `Utils` is an object used as a namespace, not exported functions. One of its functions uses `this` and breaks when picked out. | `Utilities.ts:67-466` | medium |
| I8 | A test double, `MockLocalStorage`, lives in the game code and appears in its types. | `Utilities.ts:47-65` | small |
| I9 | Five compiler options are off although they cost almost nothing to turn on, and the config for the build tooling is not strict. | `tsconfig.app.json`, `tsconfig.node.json` | small |

For I9, the errors each option would raise today: `noImplicitReturns`
0, `noUncheckedSideEffectImports` 0, `exactOptionalPropertyTypes` 6,
`noImplicitOverride` 7, `noPropertyAccessFromIndexSignature` 12. The
valuable one, `noUncheckedIndexedAccess`, raises 196 and is its own
task.

### Larger

| Id | Finding | Where | Effort |
|----|---------|-------|--------|
| G3 | About 95 fields in five classes are declared with `declare`, which switches off the check that they are set. `new Game()`, `new Ship(15)` and `new SolarSystem()` return objects whose "always set" fields are all empty, and the types cannot tell. | `Game.ts`, `Ship.ts`, `SolarSystem.ts`, `Commander.ts`, `CrewMember.ts` | large |
| G4 | Up to four ways to read or write one field: `setCredits()`, `getCredits()`, `get credits` and `set credits`. About 14 such groups. Most setters silently ignore a bad value. | `Commander.ts`, `SolarSystem.ts`, `Game.ts` | medium |
| G5 | Fields and parameters typed `number` where a list type exists: end status, special event, difficulty, ship model, opponent type. About 70. This is why lookups need a cast and can return nothing while typed as always returning. | all rules files | medium |
| G6 | `EncounterType` has no type at all and is queried with names built from text: `ENCOUNTER(type, 'Police')`. A misspelt name compiles and silently answers "no". 38 call sites. | `EncounterController.ts:48-159` | medium |

Related, smaller: the `!` mark is used about 80 times in the rules to
silence the compiler, 26 of them on `delegate`, a field that
`invalidate()` sets to nothing. The countdown lists nested as
`DaysUntilInvasion._7` force their type down to `number`, and the same
"is the countdown running" test is written out eight times.

## 6. Code smells and structure

| Id | Finding | Where | Effort |
|----|---------|-------|--------|
| G1 | `performAction` is 880 lines, with functions nested four deep, choosing among eleven actions by the text on the button. | `EncounterController.ts:434-1314` | large |
| G2 | `_processEncounters` is 630 lines and does three jobs: who you meet, how they behave, and what happens on arrival. The function that builds an opponent is 370 lines. | `Travel.ts:110-741`, `Opponent.ts:47-417` | large |
| G7 | The rules and the session import each other, in three cycles. Every rule depends on one global `session` that can be swapped. | `session.ts`, `Chart.ts`, `News.ts`, `ShipYard.ts` | medium |
| G8 | Who tells the page to redraw is inconsistent: some rules do it, and for the bank and cargo the screen does. | 12 places in the rules, 4 in the screens | small |
| G9 | Four rules trust the screen to have disabled the button: buying equipment, the escape pod, hiring, and the news. Two confirmations can be open at once and both apply. | `Equipment.ts:72-82`, `ShipYard.ts:87-93`, `Roster.ts:39-43` | small |
| G10 | The session holds page concerns: two counters that exist to make React redraw, and a handle into the map component. The difficulty level is stored in four places with nothing keeping them equal. | `session.ts:58-79`; `Game.ts`, `Commander.ts`, `Ship.ts`, `SolarSystem.ts` | medium |

Recurring smaller smells, with rough counts:

- **Copied blocks.** The "reactor is aboard" test is written 8 times,
  "show an alert, then continue" about 10 times, confiscating contraband
  3 times, the crew skill function 4 times, "find the nearest free
  system" 3 times.
- **Unnamed numbers.** Hull upgrade 50, compactor range 18, antidote
  bays 10, reactor days 2, 16 and 18 beside a named value in the same
  `switch`, and system names compared as text.
- **Long functions.** Thirteen are over 50 lines.
- **Opening the chart re-sorts the game's list of systems**, and later
  rules walk that order. This is deliberate and must stay, but nothing
  tests it by name.

### Dead code and leftovers

| Id | Finding | Where | Effort |
|----|---------|-------|--------|
| D1 | Fifteen unused functions in `Utilities.ts`, about 200 lines: colour maths, easing, base64, score obfuscation from another project. | `Utilities.ts` | small |
| D2 | About 250 unused lines in `PCEImage.ts`, three of them kept compiling only by `@ts-expect-error`. The file also draws on a canvas, although `src/game/` is meant to be free of page code. | `PCEImage.ts:211-548` | small |
| D3 | Checks that can never be true or false: a value used before it is tested, tests for "not empty" on fields that are never empty, two branches for a police type that is always changed earlier. | `Ship.ts`, `Game.ts`, `EncounterController.ts:1438, 1676` | small |
| D4 | `_warpSystem` and `_lastSave` are saved and restored but never read. Asking for the saved state also changes the game. | `Game.ts` | small |
| D5 | Unused constants and functions: `SQR`, `HUGE_SQR_DISTANCE`, `COUNT_BUYABLE_ACCESSORIES`, `assertEqualFloats`, the replay's `hackHandler`. | several | small |
| D6 | Seven `console.log` calls left in the rules, and about 25 comments that only repeat a method's name or name Objective-C types. | `Travel.ts`, `EncounterController.ts`, `Ship.ts` | small |
| D7 | `MAX_HIGH_SCORES` is defined twice. | `session.ts:21`, `HallOfFame.ts:10` | small |

## 7. The screens

### Accessibility

| Id | Finding | Where | Effort |
|----|---------|-------|--------|
| A1 | Alerts are not dialogs. Focus stays on the button behind them, so Enter presses it again, Tab walks the covered page, and a screen reader is never told an alert opened. | `AlertHost.tsx:64-79` | medium |
| A2 | Links stand in for buttons, placed beside empty list items. Space does not work on them and the markup is invalid. | `Logged.tsx:64`; `Landing.tsx`, `Travel.tsx`, `News.tsx` | small |
| A3 | Images have no `alt`, so a screen reader reads out their long data address before every button. | `Icon.tsx`, `ShipPicture.tsx`, `NewCommander.tsx` | small |
| A4 | Six inputs have no label: the difficulty list, four skill sliders, and the slider in alerts. | `NewCommander.tsx`, `AlertHost.tsx` | small |
| A5 | Tables have no header cells, and the cargo table's amount and price columns have no heading at all. | five screens | small |
| A6 | The "danger" button text in dark mode has too little contrast, about 3.8 to 1 where 4.5 to 1 is the usual minimum. Worked out by hand, not measured. | `style.css:26, 33` | small |
| A7 | Fades, sliding bars and the pulsing ring on the map ignore the "reduce motion" setting. | `style.css`, `GalaxyView.ts` | small |
| A8 | Text cannot be selected anywhere on the page, including the debug log. | `style.css:50-57` | small |

### Canvases

| Id | Finding | Where | Effort |
|----|---------|-------|--------|
| C1 | Both canvases redraw 60 times a second for as long as they are shown, for a picture that is mostly still. Each frame measures the page and reads styles, once more per planet. The code says so itself: "Excessive to run this the whole time". | `GalaxyView.ts`, `TravelProgressView.ts` | medium |
| C2 | 34 fields use `declare`. The travel strip is told its progress before its first frame, so a field typed as a number is empty; it works by accident. | both canvas files | small |
| C3 | A map that has been removed stays registered for replayed map clicks, which keeps it and its game in memory. | `GalaxyView.ts:55-59` | small |
| C4 | The canvas is not redrawn sharply when the window moves to a screen with a different pixel density. | both canvas files | small |
| C5 | The font list says `san-serif`, which is not a font family, and two branches can never run. | `GalaxyView.ts:394` | small |

### Stylesheet

| Id | Finding | Where | Effort |
|----|---------|-------|--------|
| Y1 | The bottom margin is always zero on devices without a notch. The last of three lines wins and evaluates to zero. | `style.css:46-48` | small |
| Y2 | Dark mode does not reach the browser's own controls: the difficulty list, checkboxes, sliders and scroll bars stay light. One line, `color-scheme: light dark`, fixes it. | `style.css` | small |
| Y3 | Nine rules style things that no longer exist. | `style.css` | small |
| Y4 | About eight groups of rules repeat each other, roughly a third of the file. | `style.css` | small |
| Y5 | Four lines are not valid CSS. | `style.css:50-57` | small |
| Y6 | Fixed pixel values remain in a layout that otherwise grows with the text, and spacing is done with 35 line breaks in the markup. | `style.css`, ten components | medium |

### Offline

| Id | Finding | Where | Effort |
|----|---------|-------|--------|
| O1 | The service worker file never changes, so the browser never installs a new one and nothing is ever removed from its store. Old builds pile up, and files without a hash in their name (the icons, the manifest) are never refreshed. | `public/sw.js` | medium |
| O2 | Every page load downloads again everything that is already stored. | `offline.ts:5-12` | small |
| O3 | Writes to the store are not waited for and their errors are dropped. | `public/sw.js:57-61` | small |
| O4 | The manifest lists 112 icons, none of the kind Android needs to avoid a white circle, and no theme colour. | `public/manifest.json`, `index.html` | small |

One more for the screens: two ways to reach the session exist side by
side, a prop and the global. If they ever differ, half the page stops
updating.

## 8. Tests

The recorded tests are specific: they check exact texts and numbers, are
seeded, and fail loudly when an element is missing. The weaknesses are
around them.

| Id | Finding | Where | Effort |
|----|---------|-------|--------|
| X1 | Nothing reads the coverage probes. All 151 `pLog.log(n)` calls record into a log that no test checks. The old game printed which probes were missed; that step was lost in the conversion. | `Utilities.ts:13-45` | small |
| X2 | No test loads a damaged or old save, or fills the storage. This is why L1 and L2 went unnoticed. | `session.test.ts` | small |
| X3 | The one test for an old saved game checks only the commander's name, which is also the default name of a new game. | `tests/game.test.ts:17-27` | small |
| X4 | The harness leaves a drawn game behind each time a test starts a second one: 16 in all. Each still listens to an old session. | `tests/flows/harness.ts:27-41, 62` | small |
| X5 | Clean-up written at the end of a test is skipped when the test fails, so one failure can cause misleading ones after it. 13 tests. | seven test files | small |
| X6 | The stress test always walks the same five paths from one fixed seed, and checks only "nothing throws" and "saves round-trip". | `tests/flows/stress.test.ts` | medium |
| X7 | 150 recordings are written into the test files, of which 91 differ. Renaming one button id means editing the same long line in many places. | `tests/flows/*.test.ts` | medium |
| X8 | At least 12 groups of tests are copies that differ in 2 to 13 lines, about 45 tests. The three captains alone account for about 600 lines. | `rareEvents.test.ts`, `quests.test.ts`, `replay.test.ts` | medium |
| X9 | Every check of the game's state is written twice, before and after a save. About 580 lines add almost nothing once the two games are known to be equal. | `quests.test.ts` and others | medium |
| X10 | 49 checks hide the value when they fail: "expected false to be true" in place of the text that was on screen. | flow tests | small |
| X11 | A replay prints about 7,300 lines per run, which buries real warnings. | `ActionLogReplay.ts`, `ActionLogger.ts` | small |
| X12 | Four tests promise more than they check. "Every tech level, status and resource has its text" checks 2 of 8, 2 of 8 and 2 of 13. | `TradeItem.types.test.ts`, `Politics.test.ts`, `replay.test.ts`, `quests.test.ts` | small |
| X13 | Nothing tests what the canvases draw, dark mode, typing a commander's name, or the bugs in section 3. A comment in the config claims canvas pixels are checked; they are not. | `vite.config.ts:17` | medium |

Most of the rules are tested only through the recordings. The files
with no direct test at all are `EncounterController.ts` (2,071 lines,
apart from one helper), `Travel.ts`, `Ship.ts` beyond its model table,
`Commander.ts`, `Game.ts`, `SolarSystem.ts`, `Opponent.ts`, `Warp.ts`,
`Plunder.ts`, `Equipment.ts`, `ShipYard.ts`, `Roster.ts` and `Chart.ts`.

## 9. Tooling

| Id | Finding | Where | Checked | Effort |
|----|---------|-------|---------|--------|
| T1 | The checks on a pull request are skipped when it changes only CSS, HTML or files in `public/`. | `.github/workflows/pull_request.yml:5-9` | Yes | small |
| T2 | The release config names another project's repository and publishes to npm, for a private game. The release job is commented out and calls a script that does not exist. | `.releaserc.json`, `release.yml` | Yes | small |
| T3 | The stress test and the offline check never run in the pipeline. The offline check is the only test the service worker has. | `pull_request.yml`, `package.json` | Reviewer | small |
| T4 | There is no command to check types without building, and no single command that runs what the pipeline runs. | `package.json` | Reviewer | small |
| T5 | Eleven lint rules are switched off for the tests. Nine of them have no hits, so the exception does nothing except excuse new test code. | `eslint.config.js:22-37` | Reviewer | small |
| T6 | Lint does not use type information, so rules such as "a promise is not waited for" cannot run. The JavaScript files (`sw.js`, the offline script) get no rules at all. | `eslint.config.js` | Reviewer | medium |
| T7 | Two lint packages are installed and never used. | `package.json:42-43` | Yes | small |
| T8 | Renovate updates `vitest` and `@vitest/browser` in separate pull requests, though they must match. | `renovate.json:82-98` | Reviewer | small |
| T9 | The README omits three commands the pipeline runs, and names no Node version. | `README.md` | Reviewer | small |

## 10. In good shape

- **The React layer.** Effects clean up after themselves, StrictMode is
  handled, list keys are stable, and there is no `any` and no cast in
  the screens.
- **The table modules.** Governments, trade items, ship models, special
  events and the text tables are checked for completeness by the
  compiler and have tests.
- **The small rules modules.** Bank, Cargo, NewCommander, Chart and
  Roster are short and readable.
- **Saving and loading of valid games.** Crew identity, cargo order,
  shield power and wormhole links all survive a round trip.
- **Replays.** They are seeded, each starts from fresh state, and no
  flow test depends on another.
- **The auto-attack and auto-flee timers.** They stop on every way out
  of an encounter.
- **The pipeline basics.** The install is frozen, actions are pinned,
  and the main compiler config is strict.
- **The service worker's basics.** It handles only the game's own
  files, tries the network first for the page, and one failed file does
  not block the rest.

## 11. Not checked

- **The original game beyond the rule findings.** The Palm source was
  compared only for the findings in section 3, not read as a whole, so
  other departures from it may exist. The iOS version was not seen.
- **Running anything.** No test, browser or phone was used for this
  review. Contrast figures were worked out by hand. No bug was
  reproduced by playing; each was read from the code.
- **The generated flow tests line by line.** They were sampled.
- **`src/game/Images.ts`.** It is generated picture data.
- **Whether a fix in P2 changes a recording.** That needs the tests to
  be run after each fix.
- **Findings marked "Reviewer".** One reviewer read and quoted the
  code; I did not read it a second time.
