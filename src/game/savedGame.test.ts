import { expect, test } from 'vitest';
import { newGame } from '../tests/support/newGame.ts';
import oldSave from '../tests/fixtures/old-save.json';
import { parseSavedGame, SAVE_VERSION } from './savedGame.ts';

// A saved game as it comes back out of storage.
function saved(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(newGame().toState()));
}

test('a saved game passes the check unchanged, with its version', () => {
  const state = saved();

  expect(state.version).toBe(SAVE_VERSION);
  expect(parseSavedGame(state)).toEqual(state);
});

test('a save from before versions existed is read as version 1', () => {
  const state = saved();
  delete state.version;

  expect(parseSavedGame(state)?.version).toBe(1);
});

test('the old fixture still passes the check', () => {
  expect(parseSavedGame(Object.values(oldSave.games)[0])).not.toBeNull();
});

test.each([
  ['a missing field', (state: Record<string, unknown>) => delete state.difficulty],
  ['a field of the wrong type', (state: Record<string, unknown>) => (state.difficulty = 'hard')],
  ['a number that is not a number', (state: Record<string, unknown>) => (state.score = null)],
  ['a field the game does not know', (state: Record<string, unknown>) => (state.extra = 1)],
  ['a version from the future', (state: Record<string, unknown>) => (state.version = 99)],
  [
    'a commander in a system that does not exist',
    (state: Record<string, unknown>) =>
      ((state.commander as Record<string, unknown>).currentSystemName = 'Nowhere'),
  ],
  [
    'a ship model that does not exist',
    (state: Record<string, unknown>) =>
      (((state.commander as Record<string, unknown>).ship as Record<string, unknown>).type = 999),
  ],
  [
    'a damaged ship',
    (state: Record<string, unknown>) =>
      ((state.commander as Record<string, unknown>).ship = { type: 1 }),
  ],
])('a save with %s is refused', (_, damage) => {
  const state = saved();
  damage(state);

  expect(parseSavedGame(state)).toBeNull();
});

test.each([[null], [undefined], ['a string'], [42], [[]]])(
  'something that is not a saved game at all (%j) is refused',
  value => {
    expect(parseSavedGame(value)).toBeNull();
  }
);
