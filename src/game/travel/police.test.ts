import { expect, test, vi } from 'vitest';
import { cloaked, nextOpponentIs, opponentIn, tripFor } from '../../tests/support/encounters.ts';
import { newGame } from '../../tests/support/newGame.ts';
import { AccessoryType } from '../Accessory.ts';
import { PoliceRecordScore, ReputationScore } from '../Commander.ts';
import { EncounterType } from '../encounter/types.ts';
import type { Game } from '../Game.ts';
import { OpponentType } from '../opponent/Opponent.ts';
import { runtime } from '../runtime.ts';
import { ShipModelType } from '../Ship.ts';
import { policeMeeting } from './police.ts';

const { Gnat, Wasp } = ShipModelType;
const armed = [AccessoryType.WeaponPulseLaser];

type Police = { model: ShipModelType; weapons: AccessoryType[]; cloak?: boolean };

// How police in this ship take the commander, who flies a Gnat.
function policeReaction(game: Game, { model, weapons, cloak = false }: Police) {
  const fitting = cloak ? { ...cloaked, weapons } : { weapons };
  nextOpponentIs(opponentIn(game, OpponentType.Police, model, fitting));
  return policeMeeting(tripFor(game).travel, OpponentType.Police, 5).encounterType;
}

function criminal(reputation = 0): Game {
  const game = newGame();
  game.commander.policeRecordScore = PoliceRecordScore.Criminal;
  game.commander.reputationScore = reputation;
  return game;
}

test.each([
  ['flee', { model: Gnat, weapons: [] }, EncounterType.PoliceFlee],
  ['are not met when cloaked', { model: Gnat, weapons: [], cloak: true }, EncounterType.None],
  ['inspect from a larger ship', { model: Wasp, weapons: [] }, EncounterType.PoliceInspection],
])('unarmed police meeting a criminal %s', (_, police, expected) => {
  expect(policeReaction(criminal(), police)).toBe(expected);
});

// A reputation that makes the police roll below it and back off.
const feared = ReputationScore.Elite;

test.each([
  ['flee from a feared criminal', { model: Gnat, weapons: armed }, EncounterType.PoliceFlee],
  [
    'attack a feared criminal from a larger ship',
    { model: Wasp, weapons: armed },
    EncounterType.PoliceAttack,
  ],
  [
    'are not met when they would flee unseen',
    { model: Gnat, weapons: armed, cloak: true },
    EncounterType.None,
  ],
])('armed police %s', (_, police, expected) => {
  vi.spyOn(runtime.gameRand, 'randomIntBelow').mockReturnValueOnce(0);

  expect(policeReaction(criminal(feared), police)).toBe(expected);
});

test('police fleeing a criminal are not met with "ignore police" on', () => {
  const game = criminal();
  game.alwaysIgnorePolice = true;

  expect(policeReaction(game, { model: Gnat, weapons: [] })).toBe(EncounterType.None);
});

function lawful(): Game {
  const game = newGame();
  game.commander.policeRecordScore = PoliceRecordScore.Lawful;
  return game;
}

test('police inspect a lawful commander on one roll in forty', () => {
  const game = lawful();
  vi.spyOn(runtime.gameRand, 'randomIntBelow').mockReturnValueOnce(1);

  expect(policeReaction(game, { model: Gnat, weapons: armed })).toBe(
    EncounterType.PoliceInspection
  );
  expect(game.commander.inspected).toBe(true);
});

test('police ignore a lawful commander on every other roll', () => {
  vi.spyOn(runtime.gameRand, 'randomIntBelow').mockReturnValueOnce(0);

  expect(policeReaction(lawful(), { model: Gnat, weapons: armed })).toBe(
    EncounterType.PoliceIgnore
  );
});

test('police do not inspect a lawful commander twice on one trip', () => {
  const game = lawful();
  game.commander.inspected = true;
  vi.spyOn(runtime.gameRand, 'randomIntBelow').mockReturnValueOnce(1);

  expect(policeReaction(game, { model: Gnat, weapons: armed })).toBe(EncounterType.PoliceIgnore);
});
