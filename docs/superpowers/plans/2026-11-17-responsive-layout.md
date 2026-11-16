# Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** One column that grows with the window, with text, icons,
pictures and spacing growing in step.

**Architecture:** The page's base text size is set from the window width
with `clamp()`. Every fixed pixel size in `src/ui/style.css` becomes a
multiple of it. Layout containers become flex containers. No component
logic changes except the ship bars, which are sized by percentage.

**Tech Stack:** CSS (Flexbox, `clamp`, `rem`), React 19, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-17-responsive-layout-design.md`

## Global Constraints

- No change to wording, element ids, what a screen contains, or rules.
- The recorded tests in `src/tests/UnitTests.ts` are not edited.
- Base text size: about 15px at a 375px window, about 20px at 1440px and
  above, never smaller than 15px.
- `#game` is `min(100%, 60rem)` wide and centred.
- No sideways scroll at 320px.
- Tables stay for cargo, equipment, ships, roster and the chart.
- No new dependencies.
- Branch `feature/responsive-layout`, stacked on
  `fix/ship-bars-and-startup`. After every task:
  `pnpm lint && pnpm build && pnpm test` pass.

## Review Focus

1. **A very narrow phone (320px).** Expected: no sideways scroll on the
   cargo, equipment, ship yard and chart tables. Checked in Task 4.
2. **Resizing the window during an encounter.** Expected: bars keep the
   right proportion. Test in Task 1.
3. **Dark mode.** Expected: nothing unreadable after the rewrite; the
   dark rules still apply. Checked by eye in Task 4.
4. **The galaxy map after a resize.** Expected: it redraws sharp at the
   new size, as it does today. Checked by eye in Task 4.
5. **Long text in an alert on a phone.** Expected: the alert fits the
   window and its buttons are reachable. Checked by eye in Task 4.

---

### Task 1: Bars sized by percentage

**Files:**
- Modify: `src/ui/ShipView.tsx`, `src/tests/shipView.test.tsx`

**Interfaces:**
- Produces: `ShipView` sets `style.width` of `#battle-hpBar-<side>` and
  of the shield bar to `<fraction * 100>%`. No layout effect, no
  measuring.

- [ ] **Step 1:** Change `src/tests/shipView.test.tsx` to expect
  `bar.style.width` to be `'50%'` where it expects `'50px'`, and add:

  ```tsx
  test('the bar keeps its proportion when its container changes size', () => {
    // render a ship at half hull, then set the container's width to 300px
    expect(getComputedStyle(bar).width).toBe('150px')
  })
  ```

- [ ] **Step 2:** Run `pnpm exec vitest run --project browser
  src/tests/shipView.test.tsx`. Expected: FAIL (`'50px'` is not `'50%'`).
- [ ] **Step 3:** Set the widths as inline percentages in the markup and
  delete `sizeBar` and the layout effect.
- [ ] **Step 4:** Run `pnpm lint && pnpm build && pnpm test`. Expected:
  PASS, including the recorded bar tests.
- [ ] **Step 5:** Commit: `refactor: size ship bars by percentage`.

### Task 2: The scale and the column

**Files:**
- Modify: `src/ui/style.css`

- [ ] **Step 1:** Set the base size:
  `html { font-size: clamp(15px, 13.24px + 0.47vw, 20px); }` and make
  `body` use `1rem` in place of `11pt`. Remove the two invalid
  `orientation` rules; keep their font family on `body`.
- [ ] **Step 2:** `#game { width: min(100%, 60rem); margin: auto; }`.
  Remove the `max-width: 600px` media query.
- [ ] **Step 3:** Convert every remaining `px` length to `rem` at
  15px = 1rem (20px becomes 1.333rem), except 1px borders, shadows and
  `border-radius`.
- [ ] **Step 4:** Give ship pictures a width from the scale:
  `.full-width-img` gets `height: 4rem; width: auto`.
- [ ] **Step 5:** Run `pnpm lint && pnpm build && pnpm test`. Expected:
  PASS.
- [ ] **Step 6:** Commit: `feat: scale the whole layout with the window`.

### Task 3: Flexbox

**Files:**
- Modify: `src/ui/style.css`, and components only where a wrapper class
  is missing.

- [ ] **Step 1:** Make these flex columns with a gap in place of `<br>`
  spacing and auto margins where the stylesheet alone can do it: `#game`,
  `#systemLandingDiv`, `#newCommanderDiv > .centered`, `#fuelDiv`,
  `#repairDiv`, `.battleButtons`.
- [ ] **Step 2:** Make button groups in table cells wrap:
  `td.centered-cell` and the plunder cells become
  `display: flex; flex-wrap: wrap; justify-content: center; gap`.
  Check that table rows keep their height on a wide window.
- [ ] **Step 3:** Run `pnpm lint && pnpm build && pnpm test`. Expected:
  PASS.
- [ ] **Step 4:** Commit: `feat: lay out the screens with flexbox`.

### Task 4: Check at three widths and clean up

**Files:**
- Delete: `scripts/compare-screens.mjs`
- Modify: `README.md`

- [ ] **Step 1:** With a temporary script, take pictures of new
  commander, landing, buy, equipment, ship yard, chart, warp, an
  encounter and an alert at 320, 375, 800 and 1440px, in light and dark
  mode, and look at each. Fix what is wrong; rerun the checks.
- [ ] **Step 2:** Confirm no sideways scroll at 320px on each screen:
  `document.documentElement.scrollWidth <= window.innerWidth`.
- [ ] **Step 3:** Delete `scripts/compare-screens.mjs` and its README
  paragraph. Update the README roadmap.
- [ ] **Step 4:** Run `pnpm lint && pnpm build && pnpm test &&
  pnpm test:stress`. Expected: PASS.
- [ ] **Step 5:** Commit, push, and open a pull request against
  `fix/ship-bars-and-startup`.
