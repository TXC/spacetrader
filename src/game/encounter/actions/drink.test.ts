import { expect, test, vi } from 'vitest';
import { encounterWith } from '../../../tests/support/encounters.ts';
import { newGame, press } from '../../../tests/support/newGame.ts';
import type { Commander } from '../../Commander.ts';
import { Opponent, OpponentType } from '../../opponent/Opponent.ts';
import { runtime } from '../../runtime.ts';
import { Difficulty } from '../../SolarSystem.types.ts';
import { EncounterType } from '../types.ts';

const { BottleGood, BottleOld } = EncounterType;
const { Normal, Hard } = Difficulty;

const totalSkill = (c: Commander) => c.pilot + c.fighter + c.trader + c.engineer;

test.each([
  ['the good tonic at Normal adds two skill points', BottleGood, Normal, 2],
  ['the good tonic at Hard adds one skill point', BottleGood, Hard, 1],
  ['the old tonic at Normal leaves the total skill as it was', BottleOld, Normal, 0],
  ['the old tonic at Hard takes one skill point', BottleOld, Hard, -1],
])('drinking %s', (_, bottle, difficulty, change) => {
  const game = newGame(difficulty);
  const before = totalSkill(game.commander);
  const opponent = Opponent.generateOpponentWithType(OpponentType.Bottle, game);
  const { encounter, listener } = encounterWith(game, bottle, opponent);

  encounter.performAction('Drink');
  press('Yes, drink it');
  press('Dismiss');

  expect(totalSkill(game.commander)).toBe(before + change);
  expect(listener.continues).toHaveBeenCalledWith(false);
});

type Skills = { pilot: number; fighter: number; trader: number; engineer: number };

// Drinks the old tonic with the generator's draws set in advance. Checks that the tonic
// makes exactly these draws, each of one of the four skills, and returns the skills after.
function drinkOld(difficulty: Difficulty, draws: number[], skills: Partial<Skills> = {}) {
  const game = newGame(difficulty);
  Object.assign(game.commander, skills);
  const opponent = Opponent.generateOpponentWithType(OpponentType.Bottle, game);
  const { encounter } = encounterWith(game, BottleOld, opponent);
  const rolls = vi.spyOn(runtime.gameRand, 'randomIntBelow');
  draws.forEach(draw => rolls.mockReturnValueOnce(draw));

  encounter.performAction('Drink');
  press('Yes, drink it');
  press('Dismiss');

  expect(rolls.mock.calls).toEqual(draws.map(() => [4]));
  const { pilot, fighter, trader, engineer } = game.commander;
  return { pilot, fighter, trader, engineer };
}

// Draws name the skills in the original's order: 0 pilot, 1 fighter, 2 trader, 3 engineer.
test('at Hard the old tonic takes all three points from one skill', () => {
  expect(drinkOld(Hard, [0, 1, 3])).toEqual({ pilot: 6, fighter: 6, trader: 5, engineer: 2 });
});

test('below Hard the old tonic works again until a skill has changed', () => {
  // The first point goes to the pilot skill and is taken straight back from it.
  expect(drinkOld(Normal, [0, 0, 1, 2])).toEqual({
    pilot: 5,
    fighter: 6,
    trader: 4,
    engineer: 5,
  });
});

test('the old tonic draws again for a skill that cannot change', () => {
  // The pilot skill is at its top, and the trader skill is too low to lose three points.
  expect(drinkOld(Hard, [0, 1, 0, 3, 2, 1], { pilot: 10, trader: 3 })).toEqual({
    pilot: 10,
    fighter: 3,
    trader: 3,
    engineer: 6,
  });
});

const all = (level: number) => ({ pilot: level, fighter: level, trader: level, engineer: level });

// Where the original would draw for ever.
test.each([
  ['every skill is at its top', Normal, [], all(10), all(10)],
  ['no skill can lose three points', Hard, [0, 0], all(1), { ...all(1), pilot: 3 }],
])('the old tonic stops when %s', (_, difficulty, draws, before, after) => {
  expect(drinkOld(difficulty, draws, before)).toEqual(after);
});
