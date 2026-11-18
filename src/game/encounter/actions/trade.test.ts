import { expect, test, vi } from 'vitest';
import { encounterWith, traderWith } from '../../../tests/support/encounters.ts';
import { newGame, press, topAlert } from '../../../tests/support/newGame.ts';
import { alertStore } from '../../alerts.ts';
import { PoliceRecordScore } from '../../Commander.ts';
import type { Game } from '../../Game.ts';
import type { Opponent } from '../../opponent/Opponent.ts';
import { runtime } from '../../runtime.ts';
import { TradeItemType } from '../../TradeItem.types.ts';
import { EncounterType } from '../types.ts';

const { Water, Narcotics } = TradeItemType;
const { TraderBuy, TraderSell } = EncounterType;

// The commander presses Trade; the trader's offer is the alert on top.
function hearOffer(game: Game, type: EncounterType, trader: Opponent) {
  const { encounter, listener } = encounterWith(game, type, trader);
  encounter.performAction('Trade');
  return { offer: topAlert(), ended: listener.continues };
}

const priceIn = (offer: { title: string }) => Number(/\$(\d+) each/.exec(offer.title)![1]);
const buttons = (offer: { actions: { title: string }[] }) => offer.actions.map(a => a.title);

test('a trader selling what the commander cannot afford can only be dismissed', () => {
  const game = newGame();
  game.commander.credits = 0;
  const { offer, ended } = hearOffer(game, TraderSell, traderWith([[Water, 5]]));

  expect(offer.title).toMatch(/^The trader wants to sell Water for \$\d+ each\. Unfortunately/);
  expect(buttons(offer)).toEqual(['Dismiss']);
  press('Dismiss');

  expect(ended).toHaveBeenCalledWith(false);
  expect(game.commander.ship.tradeItemQuantityForType(Water)).toBe(0);
});

test('buying the selected amount from a trader moves the goods and the money', () => {
  const game = newGame();
  game.commander.credits = 10000;
  const trader = traderWith([[Water, 10]]);
  const { offer, ended } = hearOffer(game, TraderSell, trader);
  const price = priceIn(offer);

  expect(buttons(offer)).toEqual(['None', 'Selected', 'All']);
  press('Selected'); // the slider starts at half of the 10 on offer
  expect(topAlert().title).toBe('Thanks for the trade!');
  press('Dismiss');

  expect(game.commander.ship.tradeItemQuantityForType(Water)).toBe(5);
  expect(trader.ship.tradeItemQuantityForType(Water)).toBe(5);
  expect(game.commander.credits).toBe(10000 - 5 * price);
  expect(ended).toHaveBeenCalledWith(false);
});

test('answering "None" to a trader ends the meeting with nothing traded', () => {
  const game = newGame();
  game.commander.credits = 10000;
  const { ended } = hearOffer(game, TraderSell, traderWith([[Water, 10]]));

  press('None');

  expect(game.commander.credits).toBe(10000);
  expect(game.commander.ship.tradeItemQuantityForType(Water)).toBe(0);
  expect(ended).toHaveBeenCalledWith(false);
});

test('selling all to a trader who buys empties the hold and pays for every unit', () => {
  const game = newGame();
  game.commander.ship.boughtQuantity(10, Water, 30);
  const credits = game.commander.credits;
  const { offer } = hearOffer(game, TraderBuy, traderWith([]));
  const price = priceIn(offer);

  expect(offer.title).toBe(
    `The trader wants to buy Water and offers $${price} each. You paid about $30/unit. How many do you wish to sell?`
  );
  press('All');
  press('Dismiss');

  expect(game.commander.ship.tradeItemQuantityForType(Water)).toBe(0);
  expect(game.commander.credits).toBe(credits + 10 * price);
});

// The original ends the meeting whatever amount is chosen (Encounter.c:1697-1717,
// 1786-1806, 2309), so a player cannot ask again for a better price.
test.each([
  ['buying from a trader', TraderSell],
  ['selling to a trader', TraderBuy],
])('choosing 0 units when %s ends the meeting with nothing traded', (_, type) => {
  const game = newGame();
  game.commander.credits = 10000;
  game.commander.ship.boughtQuantity(10, Water, 30);
  const { offer, ended } = hearOffer(game, type, traderWith([[Water, 10]]));

  offer.setSliderValue(0);
  press('Selected');

  expect(ended).toHaveBeenCalledWith(false);
  expect(alertStore.open).toEqual([]);
  expect(game.commander.credits).toBe(10000);
  expect(game.commander.ship.tradeItemQuantityForType(Water)).toBe(10);
});

function criminal(): Game {
  const game = newGame();
  game.commander.policeRecordScore = PoliceRecordScore.Criminal;
  game.commander.credits = 100000;
  return game;
}

test('a criminal is offered only illegal goods by a trader who sells', () => {
  const game = criminal();
  const trader = traderWith([
    [Water, 10],
    [Narcotics, 10],
  ]);

  expect(hearOffer(game, TraderSell, trader).offer.title).toMatch(/sell Narcotics/);
});

test('a trader who buys asks a criminal only for illegal goods', () => {
  const game = criminal();
  game.commander.ship.boughtQuantity(5, Water, 0);
  game.commander.ship.boughtQuantity(5, Narcotics, 0);

  expect(hearOffer(game, TraderBuy, traderWith([])).offer.title).toMatch(/buy Narcotics/);
});

// The trader's price on this roll of the dice, for goods the market here buys at this price.
function offeredPrice(record: number, type: EncounterType, roll: number, [item, market]: Goods) {
  const game = newGame();
  game.commander.policeRecordScore = record;
  game.commander.credits = 100000;
  game.commander['_basePrices']![item] = market;
  game.commander.ship.boughtQuantity(5, item, 0);
  const trader = traderWith([[item, 5]]);
  // The first roll picks the goods, of which there is one kind; the second moves the price.
  vi.spyOn(runtime.gameRand, 'randomIntBelow').mockReturnValueOnce(0).mockReturnValueOnce(roll);
  return priceIn(hearOffer(game, type, trader).offer);
}

type Goods = [item: number, market: number];
// Prices well inside the limits of what traders pay for these goods.
const cleanTrade = [PoliceRecordScore.Clean, [Water, 40]] as const;
const criminalTrade = [PoliceRecordScore.Criminal, [Narcotics, 2500]] as const;

test.each([
  ['buying from a clean commander offers less', 10, TraderBuy, cleanTrade],
  ['buying from a criminal offers less', 45, TraderBuy, criminalTrade],
])('a trader %s on a roll of %i or below', (_, last, type, [record, goods]) => {
  const price = (roll: number) => offeredPrice(record, type, roll, [...goods]);
  expect(price(last)).toBeLessThan(price(last + 1));
});

test.each([
  ['selling to a clean commander asks more', 10, TraderSell, cleanTrade],
  ['selling to a criminal asks more', 45, TraderSell, criminalTrade],
])('a trader %s on a roll of %i or below', (_, last, type, [record, goods]) => {
  const price = (roll: number) => offeredPrice(record, type, roll, [...goods]);
  expect(price(last)).toBeGreaterThan(price(last + 1));
});
