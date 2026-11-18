import { expect, test } from 'vitest';
import { newGame } from '../tests/support/newGame.ts';
import oldSave from '../tests/fixtures/old-save.json';
import { Game } from './Game.ts';
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

type Saved = Record<string, unknown>;

// The same saved game as version 1 wrote it: with a copy of the difficulty on the
// commander, the ship and every system.
function asVersion1(state: Saved): Saved {
  const { difficulty } = state;
  const commander = state.commander as Saved;
  return {
    ...state,
    version: 1,
    commander: { ...commander, difficulty, ship: { ...(commander.ship as Saved), difficulty } },
    solarSystems: (state.solarSystems as Saved[]).map(system => ({ ...system, difficulty })),
  };
}

test('a version 2 save keeps the difficulty only on the game', () => {
  const state = saved();

  expect(state.version).toBe(2);
  expect(state.difficulty).toBe(2);
  expect(JSON.stringify(state).match(/"difficulty"/g)).toHaveLength(1);
});

test('a version 1 save is read without its copies of the difficulty', () => {
  const state = saved();

  expect(parseSavedGame(asVersion1(state))).toEqual(state);
});

test('a save from before versions existed is read as version 1', () => {
  const state = saved();
  const old = asVersion1(state);
  delete old.version;

  expect(parseSavedGame(old)).toEqual(state);
});

test('the old fixture still passes the check', () => {
  expect(parseSavedGame(Object.values(oldSave.games)[0])).not.toBeNull();
});

test('the old fixture loads to the values it was saved with', () => {
  const old = Object.values(oldSave.games)[0] as Saved;
  const { lastSave, ...loaded } = Game.load(parseSavedGame(old)!).toState();

  expect(new Date(lastSave).getTime()).not.toBeNaN();
  expect(asVersion1(loaded)).toEqual({ ...old, version: 1, lastSave: undefined });
});

test.each([
  ['a missing field', (state: Record<string, unknown>) => delete state.difficulty],
  ['a field of the wrong type', (state: Record<string, unknown>) => (state.difficulty = 'hard')],
  ['a number that is not a number', (state: Record<string, unknown>) => (state.score = null)],
  ['a field the game does not know', (state: Record<string, unknown>) => (state.extra = 1)],
  ['a version from the future', (state: Record<string, unknown>) => (state.version = 99)],
  ['version 3', (state: Record<string, unknown>) => (state.version = 3)],
  [
    'version 1 without its copies of the difficulty',
    (state: Record<string, unknown>) => (state.version = 1),
  ],
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
