import { expect, test } from 'vitest';
import { encounterWith } from '../../../tests/support/encounters.ts';
import { newGame } from '../../../tests/support/newGame.ts';
import { alertStore } from '../../alerts.ts';
import { Opponent, OpponentType } from '../../opponent/Opponent.ts';
import { EncounterType } from '../types.ts';

const { PirateIgnore, PirateAttack, ScarabIgnore, ScarabAttack } = EncounterType;
const { MonsterIgnore, MonsterAttack, DragonflyIgnore, DragonflyAttack } = EncounterType;

test.each([
  ['a pirate', OpponentType.Pirate, PirateIgnore, PirateAttack],
  ['the Scarab', OpponentType.Scarab, ScarabIgnore, ScarabAttack],
  ['the space monster', OpponentType.Monster, MonsterIgnore, MonsterAttack],
  ['the Dragonfly', OpponentType.Dragonfly, DragonflyIgnore, DragonflyAttack],
])('attacking %s that ignores the commander starts a fight', (_, type, ignoring, fighting) => {
  const game = newGame();
  const opponent = Opponent.generateOpponentWithType(type, game);
  const { encounter, listener } = encounterWith(game, ignoring, opponent);

  encounter.performAction('Attack');

  expect(encounter.type).toBe(fighting);
  expect(listener.continues).toHaveBeenCalledOnce();
});

test('attacking a famous captain who already fights asks nothing and costs no record', () => {
  const game = newGame();
  const ahab = Opponent.generateOpponentWithType(OpponentType.FamousCaptain, game);
  const type = EncounterType.FamousCaptainAhabAttack;
  const { encounter, listener } = encounterWith(game, type, ahab);

  encounter.performAction('Attack');

  expect(alertStore.open.map(alert => alert.title).join()).not.toContain('Famous captains');
  expect(game.commander.policeRecordScore).toBe(0);
  expect(encounter.type).toBe(type);
  expect(listener.continues).toHaveBeenCalledOnce();
});
