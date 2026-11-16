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
| `src/tests/`         | Tests that need a page.                             |
| `src/tests/flows/`   | Flow tests: recorded play sessions, replayed.       |
| `src/tests/support/` | The replay helper and page helpers for the tests.   |
| `old/`               | The original JavaScript game. Do not edit.          |

How the pieces fit:

- `src/game/session.ts` is the one object the screens watch. It holds
  the current game, which screen is showing, and saving and loading.
- Rules change the game and then tell the session; the screens redraw.
- Alerts are data in `src/game/alerts.ts`, drawn by one component.
- Rules never run while a screen is being drawn.

Plain tests of the rules sit next to them as `src/game/*.test.ts` and
run in Node. The flow tests replay recorded play sessions by clicking
elements by id. An element's id is therefore something the tests rely
on: renaming one breaks the recordings that use it.

## Roadmap

1. **Done:** the same game in TypeScript.
2. **Done:** every screen is a React component.
3. **Done:** a layout that follows the window. One number sets the size
   of everything: the `font-size` on `html` in `src/ui/style.css`.
4. **Done:** the recorded tests are ordinary test files.
5. **Next:** the debug panel, offline support, and tidying the
   carried-over rules code.
6. **Later:** a two-pane layout for wide screens.

The designs and plans are in `docs/superpowers/`. The ones for the
TypeScript step use the file names from before the `SSST` prefix was
dropped.
