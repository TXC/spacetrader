# Space Trader: a responsive layout

Date: 2026-11-17

## Intent

The game is a fixed 600px column with small text and 20px icons. On a
large screen it is a narrow strip; that is the "compact" feeling the
project set out to fix. This change makes the layout follow the screen:
one column that grows with the window, with everything in it growing in
step.

This is the first step towards the larger graphics. A two-pane layout
for wide screens may follow later; it is not part of this change.

## Goals

- The game fills the window up to a comfortable maximum width.
- Text, icons, ship pictures, bars and spacing grow with the window, from
  today's sizes on a phone to clearly larger on a desktop screen.
- Layout is done with Flexbox. Tables stay where the content is a table.
- A phone looks as it does today.
- The recorded tests pass unchanged.

## Non-goals

- A two-pane layout on wide screens.
- New artwork. The pixel art is shown larger, not redrawn.
- Any change to wording, to what a screen contains, or to game rules.
- Changing element ids.

## Anti-goals

- Text that becomes hard to read at any width between 320px and a wide
  desktop screen.
- A sideways scroll bar at any width.

## What exists today

- `#game` is 600px wide, and 100% below 600px.
- About 125 sizes are fixed pixels: 20px icons, 30px battle icons, 100px
  bars, a 150px title picture, a 300px bank table, a 400px alert.
- Two rules that were meant to scale the text with the window are
  invalid CSS (`font-size: 17px + 1.0vw`) and do nothing.
- Flexbox is used in a few places: the navigation links, headers with
  buttons, the encounter's two ships, alert buttons.
- The maps take their height from the window (20% and 50%).
- The health and shield bars get their width in pixels from code, by
  measuring their container. They do not follow a resized window until
  the next redraw.

## Approaches considered

**A. One scale for everything (chosen).** One base size is set on the
page from the window width. Every fixed pixel size becomes a multiple of
it. The column is fluid up to a maximum. Layout containers become flex
containers. One knob controls how large the game is.

**B. Breakpoints.** Separate fixed sizes for phone, tablet and desktop.
More rules to keep in step, and jumps where the window crosses a
breakpoint.

**C. A CSS framework.** A new dependency and a rewrite of every
component's classes, for a game with one stylesheet.

A was picked because it is the least code and has no jumps.

## Design

### The scale

The page's base text size grows smoothly with the window width, between
a minimum and a maximum:

- at 375px wide (a phone): about 15px, as today
- at 1440px wide and above: about 20px

Every other size is written relative to it (`rem` or `em`): icons,
battle icons, bars, the title picture, table padding, the alert box,
the travel strip. The two invalid text-scaling rules are removed.

### The column

`#game` is as wide as the window, up to 60 times the base size (about
900px at the smallest scale, 1200px at the largest), and centred. The
600px rule and its media query go.

### Flexbox

These become flex containers, in place of centred blocks and manual
margins:

- the game column itself, top to bottom
- the landing screen: map, navigation links, content
- the new-commander form
- the bank, ship yard and commander status sections
- the list of encounter buttons
- groups of buttons inside table cells, so they wrap on a narrow screen

Tables stay for the cargo, equipment, ships, roster and chart lists.

### Pictures

Pixel art is already drawn without smoothing. Icons get their size from
the scale. Ship pictures, which today show at their natural size, get a
width from the scale as well.

### Bars

The health and shield bars get their width as a percentage of their
container. The code that measured the container in pixels goes. The
bars then follow a resized window by themselves.

### Checking

- The recorded tests and the other tests pass. One test of the bars
  expects pixels and is updated to expect a percentage.
- Each main screen is looked at by eye at three widths: 375px, 800px
  and 1440px, in light and dark mode. The pictures are kept out of the
  repository.
- No sideways scroll at 320px.
- `scripts/compare-screens.mjs` compared screens with `old/js/` pixel by
  pixel. It cannot pass once the look changes on purpose, so it is
  removed, with its mention in the README.

## Left to the builder

- The exact numbers of the scale, within the ranges above.
- Which class names are kept and which are merged.

## Decisions made by Claude, not yet confirmed by the owner

- The scale: about 15px on a phone to about 20px on a wide screen.
- The maximum column width: 60 times the base size.
- Bars sized by percentage.
- Removing the comparison script.
- Tables stay tables.
