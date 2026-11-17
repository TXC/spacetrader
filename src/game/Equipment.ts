// What the equipment screen shows, and buying and selling equipment.
import { ACCESSORY_FOR_TYPE, AccessoryType, Gadget } from './Accessory.ts';
import type { Accessory } from './Accessory.ts';
import { AlertActionType, AlertViewController } from './alerts.ts';
import type { Game } from './Game.ts';
import { session } from './session.ts';

export type Installed = { type: number; name: string; value: number };
export type SlotSection = { title: string; slots: number; installed: Installed[]; empty: number };
export type Offer = { type: number; name: string; price: number; enabled: boolean };

function section(game: Game, title: string, accessories: Accessory[], slots: number): SlotSection {
  const installed = accessories.map(accessory => ({
    type: accessory.type,
    name: accessory.name,
    value: game.commander.sellPriceForAccessory(accessory.type),
  }));
  return { title, slots, installed, empty: Math.max(0, slots - accessories.length) };
}

export function slotSections(game: Game): SlotSection[] {
  const ship = game.commander.ship;
  return [
    section(game, 'Gadgets', ship.gadgets, ship.gadgetSlots),
    section(game, 'Weapons', ship.weapons, ship.weaponSlots),
    section(game, 'Shields', ship.shields, ship.shieldSlots),
  ];
}

function offer(game: Game, type: number, accessory: Accessory): Offer {
  const { commander } = game;
  // A gadget can be owned only once, except the extra cargo bays.
  const owned =
    accessory instanceof Gadget &&
    type !== AccessoryType.GadgetFiveExtraCargoBays &&
    commander.ship.hasGadgetOfType(type);
  const price = commander.buyPriceForAccessory(type);
  return {
    type,
    name: accessory.name,
    price,
    enabled: price !== 0 && !owned && price <= commander.spendingMoney(),
  };
}

export function offers(game: Game): Offer[] {
  const result: Offer[] = [];
  for (let type = 0; type < AccessoryType.None; type++) {
    const accessory = ACCESSORY_FOR_TYPE(type);
    if (accessory?.isBuyable) result.push(offer(game, type, accessory));
  }
  return result;
}

function confirm(text: string, yes: () => void) {
  const alert = new AlertViewController(text);
  alert.addAction('Yes', AlertActionType.Default, yes);
  alert.addAction('No', AlertActionType.Cancel, null);
  alert.presentView();
}

function whyNotBuy(game: Game, type: number, accessory: Accessory): string | null {
  if (game.commander.debt > 0) {
    return 'Before you can buy a new ship or new equipment, you must settle your debts at the bank.';
  }
  if (game.commander.ship.freeSlotsForAccessoryType(type) > 0) return null;
  const category = (accessory.constructor as typeof Accessory).accessoryCategory();
  return `You have no available ${category} slots.`;
}

// `price` is the price that was on the screen when the button was pressed.
export function buyEquipment(game: Game, type: number, price: number): void {
  const accessory = ACCESSORY_FOR_TYPE(type)!;
  const refusal = whyNotBuy(game, type, accessory);
  if (refusal) return AlertViewController.presentAlertWithDismiss(refusal);
  confirm(`Do you want to install ${accessory.name} for $${price}?`, () => {
    game.commander.ship.addAccessoryOfType(type);
    game.commander.setCredits(game.commander.credits - price);
    game.save();
    session.changed();
  });
}

export function sellEquipment(game: Game, type: number, price: number): void {
  const accessory = ACCESSORY_FOR_TYPE(type)!;
  if (type === AccessoryType.GadgetFiveExtraCargoBays && game.commander.ship.freeCargoBays() < 5) {
    const text =
      "The extra cargo bays are still filled with goods. You can only sell them when they're empty.";
    return AlertViewController.presentAlertWithDismiss(text);
  }
  confirm(`Are you sure you want to sell your ${accessory.name} for $${price}?`, () => {
    game.commander.ship.removeAccessoryOfType(type);
    game.commander.setCredits(game.commander.credits + price);
    game.save();
    session.changed();
  });
}
