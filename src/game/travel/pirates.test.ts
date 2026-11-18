import { expect, test, vi } from 'vitest';
import {
  cloakCommander,
  cloaked,
  nextOpponentIs,
  opponentIn,
} from '../../tests/support/encounters.ts';
import { newGame } from '../../tests/support/newGame.ts';
import { ReputationScore } from '../Commander.ts';
import { EncounterType } from '../encounter/types.ts';
import type { Game } from '../Game.ts';
import { OpponentType } from '../opponent/Opponent.ts';
import { runtime } from '../runtime.ts';
import { Ship, ShipModelType } from '../Ship.ts';
import { pirateMeeting } from './pirates.ts';

const { Gnat, Firefly, Grasshopper } = ShipModelType;

// How pirates in this ship take the commander.
function pirateReaction(
  game: Game,
  model: ShipModelType,
  fitting = {},
  type: OpponentType = OpponentType.Pirate
) {
  nextOpponentIs(opponentIn(type, model, fitting));
  return pirateMeeting(game, type).encounterType;
}

// A commander whose reputation makes the pirates' roll come out below it.
function feared(): Game {
  const game = newGame();
  game.commander.reputationScore = ReputationScore.Elite;
  vi.spyOn(runtime.gameRand, 'randomIntBelow').mockReturnValueOnce(0);
  return game;
}

test('pirates ignore a cloaked commander', () => {
  const game = newGame();
  cloakCommander(game);

  expect(pirateReaction(game, Gnat)).toBe(EncounterType.PirateIgnore);
});

test('pirates that ignore a cloaked commander are not met with "ignore pirates" on', () => {
  const game = newGame();
  cloakCommander(game);
  game.alwaysIgnorePirates = true;

  expect(pirateReaction(game, Gnat)).toBe(EncounterType.None);
});

test('the Mantis attack a cloaked commander', () => {
  const game = newGame();
  cloakCommander(game);

  expect(pirateReaction(game, ShipModelType.Mantis, {}, OpponentType.Mantis)).toBe(
    EncounterType.PirateAttack
  );
});

test('pirates flee from a feared commander in a ship as large as theirs', () => {
  expect(pirateReaction(feared(), Gnat)).toBe(EncounterType.PirateFlee);
});

test('fleeing pirates are not met when their cloak hides them', () => {
  expect(pirateReaction(feared(), Gnat, cloaked)).toBe(EncounterType.None);
});

test('fleeing pirates are not met with "ignore pirates" on', () => {
  const game = feared();
  game.alwaysIgnorePirates = true;

  expect(pirateReaction(game, Gnat)).toBe(EncounterType.None);
});

test.each([
  ['a Firefly attack a feared commander in a Gnat', Firefly, Gnat],
  ['a Grasshopper attack a feared commander in a Wasp', Grasshopper, ShipModelType.Wasp],
])('pirates in %s', (_, model, commanderModel) => {
  const game = feared();
  game.commander.ship = Ship.create(commanderModel);

  expect(pirateReaction(game, model)).toBe(EncounterType.PirateAttack);
});
