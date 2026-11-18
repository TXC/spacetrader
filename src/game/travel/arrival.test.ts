import { expect, test, vi } from 'vitest';
import { dismissAll, tripFor } from '../../tests/support/encounters.ts';
import { newGame, topAlert } from '../../tests/support/newGame.ts';
import type { Game } from '../Game.ts';
import { runtime } from '../runtime.ts';
import { MAX_TRIBBLES } from '../Ship.ts';
import { ReactorQuestStatus } from '../SolarSystem.types.ts';
import { TradeItemType } from '../TradeItem.types.ts';

// The messages at the end of a trip with no encounters on the way.
function arrivalMessages(game: Game): string[] {
  game.commander.travelClicksRemaining = 0;
  tripFor(game).travel._processEncounters();
  return dismissAll();
}

test('a debt of 75,000 or more is a warning on arrival', () => {
  const game = newGame();
  game.commander.debt = 75000;

  expect(arrivalMessages(game)).toContain(
    'Your debt is getting too large. Reduce it quickly or your ship will be put on a chain!'
  );
});

test('a smaller debt is a reminder every fifth day', () => {
  const game = newGame();
  game.commander.debt = 1500;
  game.commander.days = 10;

  expect(arrivalMessages(game)).toContain('You have a debt of $1500.');
});

test('the reactor kills half the tribbles when there are many', () => {
  const game = newGame();
  game.reactorStatus = ReactorQuestStatus.DaysRemaining._20;
  game.commander.ship.tribbles = 100;

  expect(arrivalMessages(game)).toContain(
    'The radiation from the Ion Reactor seems to be deadly to Tribbles. Half the Tribbles on board died.'
  );
  // Fifty are left, and those breed by up to half again.
  expect(game.commander.ship.tribbles).toBeGreaterThan(50);
  expect(game.commander.ship.tribbles).toBeLessThanOrEqual(75);
});

test('tribbles that fill the ship are "a dangerous number"', () => {
  const game = newGame();
  game.commander.ship.tribbles = 49_999;
  game.commander.ship.boughtQuantity(1, TradeItemType.Food, 0);
  // Every roll comes out as high as it can.
  vi.spyOn(runtime.gameRand, 'randomIntBelow').mockImplementation(max => Math.ceil(max) - 1);

  expect(arrivalMessages(game)).toContain(
    'Excuse me, but do you realize you have a dangerous number of tribbles on board your ship?'
  );
  expect(game.commander.ship.tribbles).toBe(MAX_TRIBBLES);
});

// A commander with no money, an empty tank and a damaged hull.
function broke(): Game {
  const game = newGame();
  game.commander.credits = 0;
  game.commander.ship.consumeFuelOverDistance(game.commander.ship.fuel);
  game.commander.ship.damageHullByAmount(50);
  return game;
}

test.each([
  ['full tanks', true, false],
  ['full hull repairs', false, true],
  ['full tanks or full hull repairs', true, true],
])('without money for %s, the arrival ends with "Darn"', (missing, autoFuel, autoRepairs) => {
  const game = broke();
  game.autoFuel = autoFuel;
  game.autoRepairs = autoRepairs;

  arrivalMessages(game);

  expect(topAlert().title).toBe(`You don't have enough money to buy ${missing}.`);
  expect(topAlert().actions.map(action => action.title)).toEqual(['Darn']);
});

test('fuel and repairs are bought on arrival when the money is there', () => {
  const game = broke();
  game.commander.credits = 10000;
  game.autoFuel = true;
  game.autoRepairs = true;

  arrivalMessages(game);

  expect(game.commander.ship.fuel).toBe(game.commander.ship.fuelTankCapacity());
  expect(game.commander.ship.hull).toBe(game.commander.ship.maximumHullStrength());
  expect(game.commander.credits).toBeLessThan(10000);
});
