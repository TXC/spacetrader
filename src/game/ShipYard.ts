// The ship yard's rules: fuel, repairs, the escape pod and trading in the ship.
import { ACCESSORY_FOR_TYPE, AccessoryType } from './Accessory.ts';
import { AlertActionType, AlertViewController } from './alerts.ts';
import type { Game } from './Game.ts';
import { session } from './session.ts';
import { Ship, shipModelForType, ShipModelType } from './Ship.ts';
import type { ShipModel } from './Ship.ts';
import { FAKE_QUEST_CARGO, FAKE_QUEST_CARGO_REACTOR } from './TradeItem.types.ts';
import { pLog } from './Utilities.ts';

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
  session.changed();
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
  session.changed();
}

export function setAutoRepairs(game: Game, on: boolean): void {
  game.autoRepairs = on;
  game.save();
  session.changed();
}

function confirm(text: string, yes: () => void) {
  const alert = new AlertViewController(text);
  alert.addAction('Yes', AlertActionType.Default, yes);
  alert.addAction('No', AlertActionType.Cancel, null);
  alert.presentView();
}

// Asks first: $2000 is a lot to lose to a slip of the finger.
export function buyEscapePod(game: Game): void {
  confirm(`Buy an escape pod for $${kEscapePodPrice}?`, () => {
    game.commander.credits -= kEscapePodPrice;
    game.commander.hasEscapePod = true;
    saved(game);
  });
}

export function priceForModel(game: Game, model: ShipModel): number {
  const price =
    game.commander.buyPriceForShipModel(model) -
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

// The three items that can only be had from quests, and what happens to each on a trade-in.
const RARE = [
  { type: AccessoryType.ShieldLightning, name: 'Lightning shield', kind: 'shield' },
  { type: AccessoryType.GadgetFuelCompactor, name: 'Fuel Compactor', kind: 'gadget' },
  { type: AccessoryType.WeaponMorgansLaser, name: "Morgan's Laser", kind: 'weapon' },
] as const;

function hasRare(ship: Ship, kind: 'shield' | 'gadget' | 'weapon', type: number): boolean {
  if (kind === 'shield') return ship.hasShieldOfType(type);
  return kind === 'gadget' ? ship.hasGadgetOfType(type) : ship.hasWeaponOfType(type);
}

function slotsFor(model: ShipModel, kind: 'shield' | 'gadget' | 'weapon'): number {
  if (kind === 'shield') return model.shieldSlots;
  return kind === 'gadget' ? model.gadgetSlots : model.weaponSlots;
}

// Which rare items move to the new ship, what that costs, and which are lost.
function rareEquipment(game: Game, model: ShipModel) {
  const kept: number[] = [];
  const lost: string[] = [];
  let extraCost = 0;
  for (const item of RARE) {
    if (!hasRare(game.commander.ship, item.kind, item.type)) continue;
    if (slotsFor(model, item.kind) === 0) {
      lost.push(`You will lose your ${item.name} due to insufficient ${item.kind} slots.`);
    } else {
      kept.push(item.type);
      extraCost += Math.floor((ACCESSORY_FOR_TYPE(item.type)!.price * 2) / 3);
    }
  }
  return { kept, lost, extraCost };
}

function tradeInPrompt(
  game: Game,
  model: ShipModel,
  price: number,
  rare: ReturnType<typeof rareEquipment>
): string {
  const credit = price < 0 ? ' a credit of' : '';
  let prompt = `Are you sure you want to trade your ${game.commander.ship.model.name} for a ${model.name} for${credit} $${Math.abs(price)}?`;
  if (rare.kept.length)
    prompt += ` To keep your rare equipment, you will need to pay an extra $${rare.extraCost}.`;
  if (rare.lost.length) prompt += ` Please note that:\n${rare.lost.join('\n')}`;
  return prompt;
}

function tradeIn(
  game: Game,
  model: ShipModel,
  price: number,
  rare: ReturnType<typeof rareEquipment>
): void {
  const ship = new Ship(model.type, game.difficulty);
  game.commander.ship.crew.forEach(crewMember => ship.addCrewMember(crewMember));
  rare.kept.forEach(type => ship.addAccessoryOfType(type));
  // Quest cargo stays with the commander. (The reactor never gets here: it blocks the sale.)
  const antidote = game.commander.ship.tradeItemQuantityForType(FAKE_QUEST_CARGO);
  ship.boughtQuantity(antidote, FAKE_QUEST_CARGO, 0);
  game.commander.ship = ship;
  game.commander.credits = game.commander.credits - price - rare.extraCost;
  saved(game);
}

export function buyShip(game: Game, model: ShipModel): void {
  const price = priceForModel(game, model);
  const refusal = whyNoTradeIn(game, price);
  if (refusal) return AlertViewController.presentAlertWithDismiss(refusal);
  const rare = rareEquipment(game, model);
  if (price + rare.extraCost > game.commander.spendingMoney()) {
    return AlertViewController.presentAlertWithDismiss(
      `You've got special equipment on board which will cost $${rare.extraCost} to move over. Unfortunately, you can't afford this cost and must sell some equipment or increase your cash to proceed.`
    );
  }
  if (model.mercenaryQuarters() < game.commander.ship.crewCount()) {
    return AlertViewController.presentAlertWithDismiss(
      "The new ship you picked doesn't have enough quarters for your crew. You need to fire some mercenaries or pick a more accommodating ship."
    );
  }
  confirm(tradeInPrompt(game, model, price, rare), () => tradeIn(game, model, price, rare));
}
