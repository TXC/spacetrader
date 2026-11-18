import { expect, test } from 'vitest';
import { newGame } from '../../tests/support/newGame.ts';
import { AccessoryType } from '../Accessory.ts';
import { EncounterType } from '../encounter/types.ts';
import { OpponentType } from '../opponent/Opponent.ts';
import { Ship, ShipModelType } from '../Ship.ts';
import { dragonflyMeeting, monsterMeeting, scarabMeeting } from './specialShips.ts';

const { ScarabIgnore, ScarabAttack, DragonflyIgnore, DragonflyAttack } = EncounterType;
const { MonsterIgnore, MonsterAttack } = EncounterType;

const ships = [
  ['the Scarab', scarabMeeting, OpponentType.Scarab, ScarabIgnore, ScarabAttack],
  ['the Dragonfly', dragonflyMeeting, OpponentType.Dragonfly, DragonflyIgnore, DragonflyAttack],
  ['the space monster', monsterMeeting, OpponentType.Monster, MonsterIgnore, MonsterAttack],
] as const;

test.each(ships)('%s ignores a commander whose cloak hides the ship', (_, meet, type, ignore) => {
  const game = newGame();
  // The Dragonfly's engineer is the best of them: 8, and 3 for its auto-repair system.
  game.commander.ship = Ship.create(ShipModelType.Bumblebee);
  game.commander.ship.addGadgetOfType(AccessoryType.GadgetCloakingDevice);
  game.commander.ship.addGadgetOfType(AccessoryType.GadgetAutoRepairSystem);
  game.commander.engineer = 10;

  expect(meet(game, type).encounterType).toBe(ignore);
});

test.each(ships)('%s attacks a commander without a cloak', (_, meet, type, __, attack) => {
  expect(meet(newGame(), type).encounterType).toBe(attack);
});
