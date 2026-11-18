import { expect, test } from 'vitest';
import { dismissAll, encounterWith } from '../../../tests/support/encounters.ts';
import { newGame, press } from '../../../tests/support/newGame.ts';
import { Opponent, OpponentType } from '../../opponent/Opponent.ts';
import { TradeItemType } from '../../TradeItem.types.ts';
import { EncounterType } from '../types.ts';

test('police who find contraband fine the commander and let the trip go on', () => {
  const game = newGame();
  const { commander } = game;
  commander.credits = 5000;
  commander.ship.boughtQuantity(2, TradeItemType.Narcotics, 0);
  const police = Opponent.generateOpponentWithType(OpponentType.Police, game);
  const { encounter, listener } = encounterWith(game, EncounterType.PoliceInspection, police);

  encounter.performAction('Submit');
  press('Yes, I still want to');
  const [found] = dismissAll();

  expect(found).toMatch(/^The police discover illegal goods in your cargo holds/);
  expect(commander.ship.tradeItemQuantityForType(TradeItemType.Narcotics)).toBe(0);
  expect(commander.credits).toBeLessThan(5000);
  expect(commander.policeRecordScore).toBe(-1);
  expect(listener.continues).toHaveBeenCalledWith(false);
});
