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
| `pnpm test`        | Run the tests: rules in Node, screens in Chromium |
| `pnpm test:stress` | Run the slower stress tests                      |
| `pnpm lint`        | Check the code style                             |
| `pnpm build`       | Type-check and build the production version      |
| `pnpm preview`     | Serve the production build locally               |

The screen tests need a browser. Install it once with:

```sh
pnpm exec playwright install chromium
```

## Layout

| Folder               | Contents                                            |
|----------------------|-----------------------------------------------------|
| `src/game/`          | Game rules. No page code and no React.              |
| `src/ui/`            | The screens, as React components, and the styles.   |
| `src/ui/canvas/`     | Canvas drawing for the star map and the trip strip. |
| `src/tests/`         | The recorded tests and other tests that need a page.|
| `src/tests/support/` | Helpers that let the recorded tests run unchanged.  |
| `old/`               | The original JavaScript game. Do not edit.          |

How the pieces fit:

- `src/game/session.ts` is the one object the screens watch. It holds
  the current game, which screen is showing, and saving and loading.
- Rules change the game and then tell the session; the screens redraw.
- Alerts are data in `src/game/alerts.ts`, drawn by one component.
- Rules never run while a screen is being drawn.

Plain tests of the rules sit next to them as `src/game/*.test.ts` and
run in Node. The recorded tests replay real play sessions by element id,
so every screen keeps the ids the original game used.

## Roadmap

1. **Done:** the same game in TypeScript.
2. **Done:** every screen is a React component.
3. **Done:** a layout that follows the window. One number sets the size
   of everything: the `font-size` on `html` in `src/ui/style.css`.
4. **Next:** rewrite the recorded tests as flow tests.
5. **Later:** the debug panel, offline support, a two-pane layout for
   wide screens, and tidying the carried-over rules code.

The designs and plans are in `docs/superpowers/`. The ones for the
TypeScript step use the file names from before the `SSST` prefix was
dropped.
