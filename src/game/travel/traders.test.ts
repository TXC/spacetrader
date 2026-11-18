import { expect, test, vi } from 'vitest';
import { nextOpponentIs, opponentIn } from '../../tests/support/encounters.ts';
import { newGame } from '../../tests/support/newGame.ts';
import { PoliceRecordScore, ReputationScore } from '../Commander.ts';
import { EncounterType } from '../encounter/types.ts';
import { OpponentType } from '../opponent/Opponent.ts';
import { runtime } from '../runtime.ts';
import { ShipModelType } from '../Ship.ts';
import { traderMeeting } from './traders.ts';

test('a trader flees from a criminal it fears', () => {
  const game = newGame();
  game.commander.policeRecordScore = PoliceRecordScore.Criminal;
  game.commander.reputationScore = ReputationScore.Elite;
  nextOpponentIs(opponentIn(OpponentType.Trader, ShipModelType.Gnat));
  vi.spyOn(runtime.gameRand, 'randomIntBelow').mockReturnValueOnce(0);

  expect(traderMeeting(game, OpponentType.Trader).encounterType).toBe(EncounterType.TraderFlee);
});
