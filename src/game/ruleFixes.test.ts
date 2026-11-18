// One test per rule bug found in the code review of 2026-11-17, named by its id there.
import { expect, test, vi } from 'vitest';
import { newGame, press, topAlert } from '../tests/support/newGame.ts';
import { AccessoryType } from './Accessory.ts';
import { alertStore } from './alerts.ts';
import { EncounterController, EncounterType } from './EncounterController.ts';
import { GameRand } from './GameRand.ts';
import { News } from './News.ts';
import { Opponent, OpponentType } from './Opponent.ts';
import { Plunder } from './Plunder.ts';
import { Ship, shipModelForType, ShipModelType } from './Ship.ts';
import { buyShip } from './ShipYard.ts';
import { JaporiQuestStatus, ReactorQuestStatus, WildQuestStatus } from './SolarSystem.types.ts';
import {
  FAKE_QUEST_CARGO,
  FAKE_QUEST_CARGO_REACTOR,
  TRADE_ITEM_COUNT,
  TradeItemType,
} from './TradeItem.types.ts';
import { hiddenByOptions, Travel } from './Travel.ts';
import { warp } from './Warp.ts';

const { Water, Furs } = TradeItemType;

// A trader whose hold holds exactly what a test puts in it.
function traderWith(game: ReturnType<typeof newGame>, cargo: [number, number][]): Opponent {
  const trader = Opponent.generateOpponentWithType(OpponentType.Trader, game);
  for (let type = 0; type < TRADE_ITEM_COUNT; type++) {
    trader.ship.soldQuantity(trader.ship.tradeItemQuantityForType(type), type);
  }
  cargo.forEach(([type, quantity]) => trader.ship.boughtQuantity(quantity, type, 0));
  return trader;
}

// An encounter whose owner ignores what it is told.
function encounter(game: ReturnType<typeof newGame>, type: number, opponent: Opponent) {
  const controller = new EncounterController(type, game, opponent);
  controller.delegate = new Proxy({}, { get: () => () => {} }) as Travel;
  return controller;
}

test('B1: dumping more than the fee allows dumps only what is paid for', () => {
  const { commander } = newGame();
  commander.ship.boughtQuantity(5, Water, 10);
  commander.credits = 20; // the fee is 15 a unit at this difficulty

  commander.attemptSaleOfItem(Water, 5, true);

  expect(commander.ship.tradeItemQuantityForType(Water)).toBe(4);
  expect(commander.credits).toBe(5);
});

test('B2: plundering takes no more than the victim holds', () => {
  const game = newGame();
  const victim = traderWith(game, [[Water, 2]]);

  new Plunder(game, victim, 'Plunder').press(Water, 5);

  expect(game.commander.ship.tradeItemQuantityForType(Water)).toBe(2);
  expect(victim.ship.tradeItemQuantityForType(Water)).toBe(0);
});

test('B2: plundering leaves with the victim what does not fit', () => {
  const game = newGame();
  const { ship } = game.commander;
  const victim = traderWith(game, [[Furs, 8]]);
  ship.boughtQuantity(ship.freeCargoBays() - 3, Water, 0);

  new Plunder(game, victim, 'Plunder').press(Furs, 'all');

  expect(ship.tradeItemQuantityForType(Furs)).toBe(3);
  expect(victim.ship.tradeItemQuantityForType(Furs)).toBe(5);
});

test('B3: removing a shield takes its power with it', () => {
  const ship = new Ship(ShipModelType.Bumblebee, 2);
  ship.addAccessoryOfType(AccessoryType.ShieldEnergy); // 100
  ship.addAccessoryOfType(AccessoryType.ShieldReflective); // 200

  ship.removeAccessoryOfType(AccessoryType.ShieldReflective);
  expect(ship._currentShieldPower).toBe(100);

  ship.removeAccessoryOfType(AccessoryType.ShieldEnergy);
  expect(ship._currentShieldPower).toBe(0);
});

test('B4: Wild is asked about first, and too much debt is a message of its own', () => {
  const game = newGame();
  game.wildStatus = WildQuestStatus.OnBoard;
  game.commander.ship.removeAccessoryOfType(AccessoryType.WeaponPulseLaser);
  game.commander.debt = 200000;
  const destination = game.solarSystems[0];
  let left = false;

  warp(game, false, destination, () => (left = true));
  expect(topAlert().title).toContain('Jonathan Wild');
  press('He can stay!');

  expect(game.wildStatus).not.toBe(WildQuestStatus.OnBoard);
  expect(topAlert().title).toContain('Your debt is too large');
  expect(topAlert().actions.map(action => action.title)).toEqual(['Darn!']);
  expect(left).toBe(false);
});

test('B5: an arrest with a good police record still costs the smallest fine', () => {
  const game = newGame();
  const { commander } = game;
  commander.credits = 100000;
  commander.policeRecordScore = 10;
  const police = Opponent.generateOpponentWithType(OpponentType.Police, game);

  encounter(game, EncounterType.PoliceInspection, police)._processArrest();

  expect(topAlert().title).toContain('a fine of $500.');
});

test('B7: the newspaper is not sold to a commander who cannot pay', () => {
  const game = newGame();
  game.commander.credits = 0;

  new News(game).buy();

  expect(game.commander.credits).toBe(0);
  expect(game.alreadyPaidForNewspaper).toBe(false);
});

test('B9: the random generator never goes above its maximum', () => {
  const rand = new GameRand(1);
  rand.randHigh = 0; // the next step lands on the largest value the generator has
  rand.randLow = 0xffffffff;

  expect(rand.randomInt(0, 9)).toBe(9);
});

test('B10: attacking at an inspection gives no "safe to submit" advice with Wild aboard', () => {
  const game = newGame();
  const police = Opponent.generateOpponentWithType(OpponentType.Police, game);
  const titles = () => alertStore.open.map(alert => alert.title).join('\n');

  encounter(game, EncounterType.PoliceInspection, police).performAction('Attack');
  expect(titles()).toContain('it should be safe to submit');

  const withWild = newGame();
  withWild.wildStatus = WildQuestStatus.OnBoard;
  encounter(withWild, EncounterType.PoliceInspection, police).performAction('Attack');
  expect(titles()).not.toContain('it should be safe to submit');
});

test('Q4: a trader sells no more than is in its hold, and the hold empties', () => {
  const game = newGame();
  game.commander.credits = 100000;
  const trader = traderWith(game, [[Water, 2]]);
  const meeting = encounter(game, EncounterType.TraderSell, trader);

  meeting.performAction('Trade');
  const { content } = topAlert();
  expect(content?.kind === 'slider' && content.max).toBe(2);

  meeting._performTradeWithAmount(2, Water, 30, true);
  expect(trader.ship.tradeItemQuantityForType(Water)).toBe(0);
});

test('Q10: the antidote for Japori moves to a newly bought ship', () => {
  const game = newGame();
  game.commander.credits = 100000;
  game.japoriQuestStatus = JaporiQuestStatus.HasMedicine;
  game.commander.ship.boughtQuantity(10, FAKE_QUEST_CARGO, 0);

  buyShip(game, shipModelForType(ShipModelType.Firefly));
  press('Yes');

  expect(game.commander.ship.type).toBe(ShipModelType.Firefly);
  expect(game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO)).toBe(10);
});

// ---- fixes that change how some recorded games play out ----

test('B6: "ignore trade in orbit" hides trade offers and nothing else', () => {
  const game = newGame();
  game.alwaysIgnoreTradeInOrbit = true;

  expect(hiddenByOptions(EncounterType.TraderSell, game)).toBe(true);
  expect(hiddenByOptions(EncounterType.TraderBuy, game)).toBe(true);
  expect(hiddenByOptions(EncounterType.TraderFlee, game)).toBe(false);
  expect(hiddenByOptions(EncounterType.TraderIgnore, game)).toBe(false);

  game.alwaysIgnoreTradeInOrbit = false;
  game.alwaysIgnoreTraders = true;
  expect(hiddenByOptions(EncounterType.TraderFlee, game)).toBe(true);
  expect(hiddenByOptions(EncounterType.TraderSell, game)).toBe(false);
});

// The end of a trip, with no encounters on the way.
function arrive(game: ReturnType<typeof newGame>): void {
  game.commander.travelClicksRemaining = 0;
  const [origin, destination] = game.solarSystems;
  new Travel(game, origin, destination, false, () => {})._processEncounters();
  for (let i = 0; i < 20 && alertStore.open.length > 0; i++) press('Dismiss');
}

test('B8: a reactor explosion with an escape pod arrives once', () => {
  const game = newGame();
  game.reactorStatus = ReactorQuestStatus.DaysRemaining._1;
  game.commander.hasEscapePod = true;
  const arrival = vi.spyOn(game, 'handleArrival');

  arrive(game);

  expect(game.reactorStatus).toBe(ReactorQuestStatus.ClosedTooLate);
  expect(arrival).toHaveBeenCalledTimes(1);
});

test('Q2: tribbles that eat narcotics die, all but a few', () => {
  const game = newGame();
  game.commander.ship.tribbles = 500;
  game.commander.ship.boughtQuantity(3, TradeItemType.Narcotics, 0);

  arrive(game);

  expect(game.commander.ship.tribbles).toBeLessThanOrEqual(6);
});

// An inspection the commander submits to, with every alert answered.
function submitToInspection(game: ReturnType<typeof newGame>): void {
  const police = Opponent.generateOpponentWithType(OpponentType.Police, game);
  encounter(game, EncounterType.PoliceInspection, police).performAction('Submit');
  press('Yes, I still want to');
  for (let i = 0; i < 5 && alertStore.open.length > 0; i++) press('Dismiss');
}

test('Q1: with the reactor aboard, contraband is still fined and the reactor taken', () => {
  const game = newGame();
  const { commander } = game;
  commander.credits = 5000;
  commander.ship.boughtQuantity(2, TradeItemType.Narcotics, 0);
  commander.ship.boughtQuantity(5, FAKE_QUEST_CARGO_REACTOR, 0);
  game.reactorStatus = ReactorQuestStatus.DaysRemaining._20;

  submitToInspection(game);

  expect(commander.ship.tradeItemQuantityForType(TradeItemType.Narcotics)).toBe(0);
  expect(commander.credits).toBeLessThan(5000);
  expect(game.reactorStatus).toBe(ReactorQuestStatus.ClosedTooLate);
  expect(commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR)).toBe(0);
});

test('Q1: with the reactor and Wild aboard, the commander is arrested', () => {
  const game = newGame();
  game.commander.ship.boughtQuantity(5, FAKE_QUEST_CARGO_REACTOR, 0);
  game.reactorStatus = ReactorQuestStatus.DaysRemaining._20;
  game.wildStatus = WildQuestStatus.OnBoard;

  submitToInspection(game);

  expect(game.wildStatus).toBe(WildQuestStatus.Closed);
  expect(game.reactorStatus).toBe(ReactorQuestStatus.ClosedTooLate);
});

test('Q3: pirates with a full hold take nothing', () => {
  const game = newGame();
  const pirate = Opponent.generateOpponentWithType(OpponentType.Pirate, game);
  pirate.ship.boughtQuantity(pirate.ship.freeCargoBays(), Water, 0);
  game.commander.ship.boughtQuantity(5, Water, 0);

  encounter(game, EncounterType.PirateAttack, pirate).performAction('Surrender');

  expect(game.commander.ship.tradeItemQuantityForType(Water)).toBe(5);
});

test('Q8: a loan is never less than 1,000 or more than 25,000 for a clean record', () => {
  const { commander } = newGame();
  expect(commander.maxLoan()).toBe(1000);

  commander.credits = 10_000_000;
  expect(commander.maxLoan()).toBe(25000);
});

test('Q9: the news is written anew on a later day in the same system', () => {
  const game = newGame();
  game.alreadyPaidForNewspaper = true;
  const news = new News(game);
  news.present();

  game.commander.days += 1;
  game.addBreakingNewsItem('Late Edition!');
  news.present();

  expect(news.text()).toContain('Late Edition!');
});
