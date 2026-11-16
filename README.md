# Space Trader

A trading game in space: trade goods, hunt bounties, amass a fortune, buy
a moon and retire.

This project moves an existing plain-JavaScript version of the game (kept
unchanged in `old/` for reference) into TypeScript and React.

## Commands

| Command            | What it does                                     |
|--------------------|--------------------------------------------------|
| `pnpm install`     | Install dependencies                             |
| `pnpm dev`         | Run the game locally with live reload            |
| `pnpm test`        | Run the test suite in headless Chromium          |
| `pnpm test:stress` | Run the slower stress tests                      |
| `pnpm lint`        | Check the code style                             |
| `pnpm build`       | Type-check and build the production version      |
| `pnpm preview`     | Serve the production build locally               |

The tests need a browser. Install it once with:

```sh
pnpm exec playwright install chromium
```

## Layout

| Folder           | Contents                                              |
|------------------|-------------------------------------------------------|
| `src/game/`      | Game rules, images and utilities. Strictly typed.     |
| `src/legacy-ui/` | The old screens, carried over with type checking off. |
| `src/tests/`     | The old test suite, run through Vitest.               |
| `old/`           | The original JavaScript game. Do not edit.            |

`src/App.tsx` hosts the game in a single `<div>`. The old screens draw
into it themselves; React does not render them yet.

## Roadmap

1. **Step 1 (done):** the same game in TypeScript, proven by the existing
   tests.
2. **Step 1.5:** separate the game rules from the old alerts, then rewrite
   the tests to drive the rules directly, without a page.
3. **Step 2:** rebuild the screens in React, with larger graphics and a
   roomier layout. The debug panel returns here as a React component.

The design and the plan for step 1 are in `docs/superpowers/`. They use
the file names from before the `SSST` prefix was dropped.
