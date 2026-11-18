import { expect, test } from 'vitest';
import { dismissAll, encounterWith, opponentIn } from '../../../tests/support/encounters.ts';
import { newGame, topAlert } from '../../../tests/support/newGame.ts';
import type { Game } from '../../Game.ts';
import { OpponentType } from '../../opponent/Opponent.ts';
import { ShipModelType } from '../../Ship.ts';
import { ReactorQuestStatus, WildQuestStatus } from '../../SolarSystem.types.ts';
import { EncounterType } from '../types.ts';

// The commander surrenders to pirates in this ship. Returns what the pirates say.
function surrenderToPirates(game: Game, model: ShipModelType = ShipModelType.Gnat): string {
  const pirates = opponentIn(OpponentType.Pirate, model);
  const { encounter, listener } = encounterWith(game, EncounterType.PirateAttack, pirates);
  encounter.performAction('Surrender');
  const [said] = dismissAll();
  expect(listener.continues).toHaveBeenCalledWith(false);
  return said;
}

test('the aliens accept no surrender from a commander without the artifact', () => {
  const game = newGame();
  const mantis = opponentIn(OpponentType.Mantis, ShipModelType.Mantis);
  encounterWith(game, EncounterType.PirateAttack, mantis).encounter.performAction('Surrender');

  expect(topAlert().title).toBe('Surrender? Ha! We want your HEAD!');
  expect(topAlert().actions.map(action => action.title)).toEqual(['Dismiss']);
});

const reactorRemark = 'They also poke around the Ion Reactor';

test('pirates look the reactor over and leave it aboard', () => {
  const game = newGame();
  game.reactorStatus = ReactorQuestStatus.DaysRemaining20;

  expect(surrenderToPirates(game)).toContain(reactorRemark);
  expect(game.reactorStatus).toBe(ReactorQuestStatus.DaysRemaining20);
});

test('pirates say nothing of a reactor that is gone', () => {
  const game = newGame();
  game.reactorStatus = ReactorQuestStatus.ClosedTooLate;

  expect(surrenderToPirates(game)).not.toContain(reactorRemark);
});

test.each([
  ['stays aboard when the pirates have no quarters', ShipModelType.Gnat, WildQuestStatus.OnBoard],
  ['leaves with pirates who have quarters', ShipModelType.Beetle, WildQuestStatus.Closed],
])('Wild %s', (_, model, wildStatus) => {
  const game = newGame();
  game.wildStatus = WildQuestStatus.OnBoard;

  expect(surrenderToPirates(game, model)).toContain('an old associate of Jonathan Wild');
  expect(game.wildStatus).toBe(wildStatus);
});

test('pirates who find no cargo take the blackmail they are owed as debt', () => {
  const game = newGame();
  game.commander.credits = 100;

  expect(surrenderToPirates(game)).toMatch(/^The pirates are upset that they found no cargo/);
  // The blackmail is at least $500.
  expect(game.commander.credits).toBe(0);
  expect(game.commander.debt).toBe(400);
});
