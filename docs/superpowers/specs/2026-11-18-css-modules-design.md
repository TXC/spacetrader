# Space Trader: styles as CSS Modules

Date: 2026-11-18. Step 8 of the
[review roadmap](../plans/2026-11-18-review-roadmap.md).
Findings Y1 to Y6 and A5 of
[the code review](../../code-review-2026-11-17.md).

## Intent

The game has one stylesheet of about 680 lines for 26 components. About
a third of it repeats itself, nine rules style things that no longer
exist, and 14 rules hang on element ids. A change to one screen means
searching the whole file, and nothing says which rules a component
uses.

This step moves each component's styles next to it, as the buttons
already are, and fixes the stylesheet findings on the way.

## Goals

- Each component's styles live in a file beside it.
- Colours are named once, in one place, for light and dark.
- No rule is styled by element id. Ids stay, as the names of recorded
  actions and as hooks for tests.
- The game looks the same afterwards, except for the listed fixes.

## Non-goals

- A new look. The three button themes discussed earlier are not part of
  this step, though named colours make them easier later.
- The two-pane layout for wide screens.
- Changing any element id.

## Anti-goals

- Class names that tests or the map's drawing code rely on changing
  without those being updated in the same change.
- A screen that looks different by accident.

## What exists today

- `src/ui/style.css`: global, about 680 lines, 83 rules, 14 id
  selectors, one dark-mode block at the end.
- `src/ui/Button.module.css`: the one module so far, with the button
  colours as variables in `style.css`.
- The map's drawing code (`GalaxyView.ts`) creates an element and gives
  it the class `gv-system-info` itself.
- The tests' finders in `src/tests/support/page.ts` use four class
  names: `alert-backdrop`, `alert-title`, `gv-system-info`, and
  `active` on the open screen's button.

## Approaches

**A. One module per component, a small global base (chosen by the
owner).** Shared pieces are reused with `composes`.

**B. Keep the one stylesheet and only clean it.** Fixes the findings
with the least change, but leaves every rule global.

**C. A utility framework such as Tailwind.** A new dependency and a
rewrite of every component's markup, for a game this size.

## Design

### What stays global

Three small files in `src/ui/styles/`, loaded once:

- `tokens.css`: every colour, the corner radii and the common spacings,
  as variables, with their dark values in one block. It also declares
  `color-scheme: light dark`, which makes the browser's own controls
  (the difficulty list, checkboxes, sliders, scroll bars) follow dark
  mode. That is finding Y2.
- `base.css`: the fluid text size, the page margins, headings, and the
  plain defaults for tables and form fields. The bottom margin is
  written so that it is no longer zero on devices without a notch
  (Y1).
- Nothing else. No component rule is global.

### Modules

One `Name.module.css` beside each component that has styles of its
own. A dark-mode block never appears in a module: modules use the
variables, and only `tokens.css` knows about dark mode.

Pieces used by several components go in `shared.module.css` and are
pulled in with `composes`:

- the pixel-art icon, in its four sizes, as one rule with a size each
  (today four copies);
- the tight tables;
- the health and shield bars (today two copies);
- "centred block" and "centred text".

### Ids, and the names others rely on

- The 14 id selectors become classes in the component's module. The
  ids stay in the markup.
- The open screen's button is found by `aria-current`, which step 7
  added, both in the styles and in the tests. The `active` class goes.
- The alert is found by its element (`dialog`) and its title by the
  dialog's label, both from step 7. The two alert class names stop
  being relied on.
- The map's info line gets its class name handed to the drawing code by
  the component, so the name can come from the module. The tests find
  it by a `data-` attribute.

### Clean-up done during the move

- Rules that style nothing are not carried over (Y3).
- Repeated groups are merged (Y4).
- Fixed pixel values become the radius and spacing variables (Y6).
- Table section titles and column headings become header cells, with
  the cargo table gaining a heading row that is hidden from view but
  read out by a screen reader (A5).

### Line breaks used for spacing

The markup has 35 `<br />` that only make space. They are replaced by
margins in the modules, screen by screen. This is the part most likely
to move something by a pixel or two.

### How it is checked

- Before any change, a script photographs every screen at 375, 800 and
  1440 pixels wide, in light and dark.
- After each screen's move, the same photographs are taken again and
  compared. A difference must be one of the listed fixes, or it is a
  mistake.
- The script and its pictures stay out of the repository, as before.
- All tests pass. The tests' finders change as described above.

### Order of work

One commit per screen, so each can be looked at alone:

1. tokens and base, with nothing moved yet;
2. shared pieces;
3. each screen in turn, smallest first;
4. alerts and the map last, since others rely on their names;
5. delete `style.css`.

## Expected visible differences

- A bottom margin appears on devices without a notch (Y1).
- In dark mode, the difficulty list, checkboxes, sliders and scroll
  bars turn dark (Y2).
- Spacing may move by a pixel or two where a line break is replaced.

Nothing else should change.

## Left to the builder

- The names of the variables and of the classes inside each module.
- Which small components share a module with their parent.

## Decisions made by Claude, not yet confirmed by the owner

- Replacing the `<br />` spacing in this step, not later.
- Finding the open screen's button, the alert and the map's info line
  by attribute or element, so no class name is a promise to the tests.
- Header cells and the hidden cargo heading row (A5) are done here.
- The comparison by photographs as the check for "looks the same".
