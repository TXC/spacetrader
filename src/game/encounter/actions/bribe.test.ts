import { expect, test } from 'vitest';
import { encounterWith } from '../../../tests/support/encounters.ts';
import { newGame, topAlert } from '../../../tests/support/newGame.ts';
import type { Game } from '../../Game.ts';
import { Opponent, OpponentType } from '../../opponent/Opponent.ts';
import { Difficulty, ReactorQuestStatus, WildQuestStatus } from '../../SolarSystem.types.ts';
import { TradeItemType } from '../../TradeItem.types.ts';
import { EncounterType } from '../types.ts';

// A commander with narcotics aboard, in a system whose police take bribes.
function smuggler(difficulty: number = Difficulty.Normal): Game {
  const game = newGame(difficulty);
  game.commander.moveTo(game.solarSystems.find(system => system.politics.bribeWillingness > 0)!);
  game.commander.ship.boughtQuantity(2, TradeItemType.Narcotics, 0);
  game.commander.credits = 20000;
  return game;
}

// The commander offers the inspecting police a bribe. Returns what they answer.
function bribe(game: Game): string {
  const police = Opponent.generateOpponentWithType(OpponentType.Police, game);
  encounterWith(game, EncounterType.PoliceInspection, police).encounter.performAction('Bribe');
  return topAlert().title;
}

const bribePrice = (answer: string) => Number(/for \$(\d+)\.$/.exec(answer)![1]);

test('the police take no bribe the commander cannot pay', () => {
  const game = smuggler();
  game.commander.credits = 0;

  expect(bribe(game)).toBe("You don't have enough cash for a bribe.");
  expect(game.commander.credits).toBe(0);
});

test.each([
  ['Wild aboard costs twice as much', Difficulty.Normal, 'wild', 2],
  ['the reactor aboard costs twice as much', Difficulty.Normal, 'reactor', 2],
  ['Wild aboard at Hard costs three times as much', Difficulty.Hard, 'wild', 3],
])('a bribe with %s', (_, difficulty, cargo, factor) => {
  const usual = bribePrice(bribe(smuggler(difficulty)));
  const game = smuggler(difficulty);
  if (cargo === 'wild') game.wildStatus = WildQuestStatus.OnBoard;
  else game.reactorStatus = ReactorQuestStatus.DaysRemaining20;

  expect(bribePrice(bribe(game))).toBe(factor * usual);
});
