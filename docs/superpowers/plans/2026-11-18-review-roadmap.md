# Roadmap: acting on the code review

Date: 2026-11-18

This is the order in which the findings of
[the code review](../../code-review-2026-11-17.md) are worked through.
Finding ids (`B1`, `T4`, ...) refer to that document, which also holds
the decisions taken so far.

## How the work is delivered

- **One pull request per step**, stacked: each branch is built on the
  one before it. Merge them in order, first to last.
- **Small steps go straight from the review to a pull request.** Each
  fix starts with a test that fails without it.
- **Four steps get a short design document first**, because they have
  real choices in them: save validation, CSS Modules, the service
  worker, and the split of the encounter and travel code. Each design
  is written when its step starts, and waits for approval.
- **Every step passes** format check, lint, type check, the tests and
  the build before it is pushed.

## Rules that hold for every step

- The order in which random numbers are drawn does not change, except
  in the steps marked "changes recordings". Those steps update the tests
  they affect, and say which.
- Element ids of buttons, links and inputs do not change.
- There are no users yet, so the format of a saved game may change.

## The steps

| # | Step | Findings | Design first? | Changes recordings? |
|---|------|----------|---------------|---------------------|
| 1 | The review and this roadmap | | | |
| 2 | Tooling: one `check` command, run on every change, stricter lint | T1, T3, T4, T5, T7, T8, T9, I9 | | No |
| 3 | Rule bugs that leave recordings alone | B1 to B5, B7, B9, B10, B11, Q1, Q4, Q10 | | No |
| 4 | Rule bugs that change the games walking those paths | B6, B8, Q2, Q3, Q8, Q9 | | Yes, a few |
| 5 | Safe saving and loading | L1 to L5, Q11, X2, X3 | Yes | No |
| 6 | Delete dead code and leftovers | D1 to D7 | | No |
| 7 | Accessibility: alerts as dialogs, real buttons, labels | A1 to A8, Q12 | | No |
| 8 | CSS Modules, with the stylesheet fixes | Y1 to Y6 | Yes | No |
| 9 | Service worker in TypeScript, clearing old files | T6, O1 to O4 | Yes | No |
| 10 | Canvases draw only when something changes | C1 to C5 | | No |
| 11 | Tests: probes, harness, duplicated tests, recordings as files | X1, X4 to X13 | | No |
| 12 | TypeScript idioms, the cheap ones | I1 to I8 | | No |
| 13 | Split the encounter and travel code into small files | G1, G2, G6 | Yes | No |
| 14 | Untangle the session from the rules | G7 to G10 | | No |
| 15 | Whole-number rolls, and placing the last mercenary | Q5, Q7 | | Yes, most |

## Not in this roadmap

- **Rebuilding the model classes** (G3, G4, G5). It is the largest and
  riskiest piece. It is easier and safer after steps 5 and 13, and
  should get its own plan then.
- **Q6**, the weighted pick of an opponent's ship. It matches the
  original game.
- **T2**, the release configuration. Fixed by the owner.

## Step 15 comes last on purpose

Both fixes change how most recorded games play out. A fight that takes
a different number of rounds no longer matches the clicks that were
recorded for it, so those recordings must be made again, not merely
have their expected numbers updated.

Before any change, step 15 counts the tests each fix breaks and reports
the number. The owner then confirms, or picks a way to place the last
mercenary that leaves the other draws untouched.

## Decisions made by Claude, not yet confirmed by the owner

- Everything in the review is in scope except the three items above.
  The owner was asked and did not object.
- The order of the steps.
- Which four steps get a design document.
- Q1, Q4 and Q10 are fixed in step 3 with the other bugs that do not
  change recordings.
