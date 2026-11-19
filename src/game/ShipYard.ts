// The ship yard's rules: fuel, repairs, the escape pod and trading in the ship.
import { AccessoryType } from './Accessory.ts';
import { AlertActionType, AlertViewController } from './alerts.ts';
import type { Game } from './Game.ts';
import { Ship, shipModelForType, ShipModelType } from './Ship.ts';
import type { ShipModel } from './Ship.ts';
import { FAKE_QUEST_CARGO, FAKE_QUEST_CARGO_REACTOR } from './TradeItem.types.ts';
import { pLog } from './probes.ts';

export const kEscapePodPrice = 2000;

const TRIBBLE_WARNING =
  'You would normally receive about 75% of the worth of a new ship as trade-in value, but a tribble-infested ship will sell for only 25%. Trading is a way to get rid of your tribbles, though...';

// What the old screen did each time it drew itself: warn once about tribbles.
export function present(game: Game): void {
  if (game.commander.ship.tribbles > 0 && !game.tribbleMessage) {
    game.tribbleMessage = true;
    AlertViewController.presentAlertWithDismiss(TRIBBLE_WARNING);
  }
}

// After an action the old screen saved and drew itself again.
function saved(game: Game): void {
  game.save();
  present(game);
  game.changed();
}

export function fuelLines(game: Game): { text: string; needed: number } {
  const ship = game.commander.ship;
  const needed = ship.fuelTankCapacity() - ship.fuel;
  const cost = ship.model.costOfFuel;
  const price =
    needed > 0 ? `\nFuel costs $${cost}/unit. A full tank costs $${needed * cost}.` : '';
  return { text: `You have fuel to fly ${ship.fuel} parsecs.${price}`, needed };
}

export function repairLines(game: Game): { text: string; needed: number } {
  const ship = game.commander.ship;
  const needed = ship.maximumHullStrength() - ship.hull;
  const cost = ship.model.repairCosts;
  let text = `Your hull strength is at ${Math.floor(100 * ship.hullPercentage())}%.`;
  if (ship.upgradedHull) text += '\nYour ship has an upgraded hull.';
  if (needed > 0) text += `\nRepairs cost $${cost} each. A full repair costs $${needed * cost}.`;
  return { text, needed };
}

const FUEL_PROBES = { 1: 39, 5: 40, full: 41 } as const;
const REPAIR_PROBES = { 1: 34, 5: 35, full: 36 } as const;

export function buyFuel(game: Game, amount: 1 | 5 | 'full'): void {
  pLog.log(FUEL_PROBES[amount]);
  const units = amount === 'full' ? game.commander.ship.fuelTankCapacity() : amount;
  game.commander.attemptPurchaseOfFuel(units);
  saved(game);
}

export function buyRepairs(game: Game, amount: 1 | 5 | 'full'): void {
  pLog.log(REPAIR_PROBES[amount]);
  const units = amount === 'full' ? game.commander.ship.maximumHullStrength() : amount;
  game.commander.attemptPurchaseOfRepairs(units);
  saved(game);
}

export function setAutoFuel(game: Game, on: boolean): void {
  game.autoFuel = on;
  game.save();
  game.changed();
}

export function setAutoRepairs(game: Game, on: boolean): void {
  game.autoRepairs = on;
  game.save();
  game.changed();
}

function confirm(text: string, yes: () => void) {
  const alert = new AlertViewController(text);
  alert.addAction('Yes', AlertActionType.Default, yes);
  alert.addAction('No', AlertActionType.Cancel, null);
  alert.presentView();
}

// Asks first: $2000 is a lot to lose to a slip of the finger. Checks when the answer
// comes: another confirmation may have been accepted before this one.
export function buyEscapePod(game: Game): void {
  confirm(`Buy an escape pod for $${kEscapePodPrice}?`, () => {
    const { commander } = game;
    if (commander.hasEscapePod || commander.credits < kEscapePodPrice) return;
    commander.credits -= kEscapePodPrice;
    commander.hasEscapePod = true;
    saved(game);
  });
}

export function priceForModel(game: Game, model: ShipModel): number {
  const price =
    game.commander.buyPriceForShipModel(model, game.difficulty) -
    game.commander.cargoAndShipValuationForInsurance(false);
  return price === 0 ? 1 : price;
}

export type ShipOffer = { model: ShipModel; priceText: string; canBuy: boolean };

function shipOffer(game: Game, model: ShipModel): ShipOffer {
  const { commander } = game;
  if (model.type === commander.ship.type) return { model, priceText: 'got one', canBuy: false };
  if (model.minTechLevel > commander.currentSystem.techLevel)
    return { model, priceText: 'not sold', canBuy: false };
  const price = priceForModel(game, model);
  const priceText = `${price >= 0 ? '' : '-'}$${Math.abs(price)}`;
  return { model, priceText, canBuy: price !== 0 && price <= commander.spendingMoney() };
}

export function shipOffers(game: Game): ShipOffer[] {
  const offers: ShipOffer[] = [];
  for (let type = 0; type <= ShipModelType.Best; type++) {
    offers.push(shipOffer(game, shipModelForType(type)));
  }
  return offers;
}

function whyNoTradeIn(game: Game, price: number): string | null {
  if (price > 0 && game.commander.debt > 0) {
    pLog.log(103);
    return 'Before you can buy a new ship or new equipment, you must settle your debts at the bank.';
  }
  if (game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR) > 0) {
    pLog.log(165);
    return "Sorry! We can't take your ship as a trade-in. That Ion Reactor looks dangerous, and we have no way of removing it. Come back when you've gotten rid of it.";
  }
  return null;
}

// The three items that can only be had from quests, with what the original asks to move
// each to a new ship (BuyShipEvent.c:227-262, 269-318).
const RARE = [
  {
    type: AccessoryType.ShieldLightning,
    name: 'Lightning Shield',
    kind: 'Shield',
    cost: 30000,
    offer:
      "I see you have a lightning shield. I'll transfer it to your new ship for 30000 credits.",
  },
  {
    type: AccessoryType.GadgetFuelCompactor,
    name: 'Fuel Compactor',
    kind: 'Gadget',
    cost: 20000,
    offer: "I see you have a fuel compactor. I'll transfer it to your new ship for 20000 credits.",
  },
  {
    type: AccessoryType.WeaponMorgansLaser,
    name: "Morgan's Laser",
    kind: 'Weapon',
    cost: 33333,
    offer:
      "I see you have a customized laser. I'll transfer it to your new ship for 33333 credits.",
  },
] as const;
type Rare = (typeof RARE)[number];

const CANNOT_AFFORD_ALL =
  "You won't have enough money to buy this ship and pay the cost to transfer all of your unique equipment. You should choose carefully which items you wish to transfer!";

// The ship on offer, and what it costs after the trade-in.
type Offer = { game: Game; model: ShipModel; price: number };

function hasRare(ship: Ship, { kind, type }: Rare): boolean {
  if (kind === 'Shield') return ship.hasShieldOfType(type);
  return kind === 'Gadget' ? ship.hasGadgetOfType(type) : ship.hasWeaponOfType(type);
}

function slotsFor(model: ShipModel, { kind }: Rare): number {
  if (kind === 'Shield') return model.shieldSlots;
  return kind === 'Gadget' ? model.gadgetSlots : model.weaponSlots;
}

const costOf = (items: Rare[]) => items.reduce((sum, item) => sum + item.cost, 0);

// What the original tells before it asks about any item (BuyShipEvent.c:227-266).
function rareWarnings({ game, model, price }: Offer, held: Rare[]): string[] {
  const warnings: string[] = held
    .filter(item => slotsFor(model, item) === 0)
    .map(
      item =>
        `If you trade your ship in for a ${model.name}, you won't be able to transfer your ${item.name} because the new ship has insufficient ${item.kind} slots!`
    );
  if (price + costOf(held) > game.commander.spendingMoney()) warnings.push(CANNOT_AFFORD_ALL);
  return warnings;
}

// Shows the messages one after the other, then goes on.
function tell(messages: string[], then: () => void): void {
  if (messages.length === 0) return then();
  const alert = new AlertViewController(messages[0]);
  alert.addAction('Dismiss', AlertActionType.Default, () => tell(messages.slice(1), then));
  alert.presentView();
}

// Asks about each item in turn, while the cash lasts, and goes on with the chosen ones
// (BuyShipEvent.c:267-318). The original does not count the item's own cost here, which
// would leave the commander with less than no cash.
function askToMove(offer: Offer, items: Rare[], chosen: Rare[], then: (chosen: Rare[]) => void) {
  if (items.length === 0) return then(chosen);
  const [item, ...rest] = items;
  const next = (moved: Rare[]) => askToMove(offer, rest, moved, then);
  const spending = offer.game.commander.spendingMoney();
  if (offer.price + costOf(chosen) + item.cost > spending) {
    const text = `Unfortunately, if you make this trade, you won't be able to afford to transfer your ${item.name} to the new ship!`;
    return tell([text], () => next(chosen));
  }
  const alert = new AlertViewController(item.offer);
  alert.addAction('Do it!', AlertActionType.Default, () => next([...chosen, item]));
  alert.addAction('No thanks', AlertActionType.Cancel, () => next(chosen));
  alert.presentView();
}

function tradeInPrompt({ game, model, price }: Offer, moved: Rare[]): string {
  const credit = price < 0 ? ' a credit of' : '';
  const end = moved.length ? ', and transfer your unique equipment to the new ship?' : '?';
  return `Are you sure you want to trade your ${game.commander.ship.model.name} for a ${model.name} for${credit} $${Math.abs(price)}${end}`;
}

function tradeIn({ game, model, price }: Offer, moved: Rare[]): void {
  const ship = Ship.create(model.type);
  game.commander.ship.crew.forEach(crewMember => ship.addCrewMember(crewMember));
  moved.forEach(item => ship.addAccessoryOfType(item.type));
  // Quest cargo stays with the commander. (The reactor never gets here: it blocks the sale.)
  const antidote = game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO);
  ship.boughtQuantity(antidote, FAKE_QUEST_CARGO, 0);
  game.commander.ship = ship;
  game.commander.credits = game.commander.credits - price - costOf(moved);
  saved(game);
}

export function buyShip(game: Game, model: ShipModel): void {
  const price = priceForModel(game, model);
  const refusal = whyNoTradeIn(game, price);
  if (refusal) return AlertViewController.presentAlertWithDismiss(refusal);
  if (model.mercenaryQuarters() < game.commander.ship.crewCount()) {
    return AlertViewController.presentAlertWithDismiss(
      "The new ship you picked doesn't have enough quarters for your crew. You need to fire some mercenaries or pick a more accommodating ship."
    );
  }
  const offer = { game, model, price };
  const held = RARE.filter(item => hasRare(game.commander.ship, item));
  const fitting = held.filter(item => slotsFor(model, item) > 0);
  tell(rareWarnings(offer, held), () =>
    askToMove(offer, fitting, [], moved =>
      confirm(tradeInPrompt(offer, moved), () => tradeIn(offer, moved))
    )
  );
}
