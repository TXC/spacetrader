import { expect, test, vi } from 'vitest';
import { newGame } from '../../tests/support/newGame.ts';
import { OPPONENT_TYPE_COUNT, OpponentType } from '../opponent/Opponent.ts';
import { runtime } from '../runtime.ts';
import { Difficulty, WildQuestStatus } from '../SolarSystem.types.ts';
import { Travel } from './Travel.ts';
import { whoIsMet } from './whoIsMet.ts';

const noOne = OPPONENT_TYPE_COUNT;

const police = OpponentType.Police;

test.each([
  ['Easy', Difficulty.Easy, 24, 'the police', police],
  ['Easy', Difficulty.Easy, 25, 'no one', noOne],
  ['Hard', Difficulty.Hard, 49, 'the police', police],
  ['Hard', Difficulty.Hard, 50, 'no one', noOne],
])('to Kravat with Wild at %s, a roll of %i meets %s', (_, difficulty, roll, __, met) => {
  const game = newGame(difficulty);
  game.wildStatus = WildQuestStatus.OnBoard;
  const kravat = game.solarSystems.find(system => system.name === 'Kravat')!;
  const travel = new Travel(game, game.commander.currentSystem, kravat, false, () => {});
  // The first roll meets no one of the ordinary kinds; the second is Kravat's.
  vi.spyOn(runtime.gameRand, 'randomIntBelow').mockReturnValueOnce(1000).mockReturnValueOnce(roll);

  expect(whoIsMet(travel, 5)).toBe(met);
});
