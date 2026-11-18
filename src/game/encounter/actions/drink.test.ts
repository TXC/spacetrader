import { expect, test } from 'vitest';
import { encounterWith } from '../../../tests/support/encounters.ts';
import { newGame, press } from '../../../tests/support/newGame.ts';
import type { Commander } from '../../Commander.ts';
import { Opponent, OpponentType } from '../../opponent/Opponent.ts';
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
