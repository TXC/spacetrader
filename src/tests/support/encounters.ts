import { vi } from 'vitest';
import { AccessoryType } from '../../game/Accessory.ts';
import { alertStore } from '../../game/alerts.ts';
import { Encounter } from '../../game/encounter/Encounter.ts';
import type { EncounterType } from '../../game/encounter/types.ts';
import type { Game } from '../../game/Game.ts';
import { Opponent, OpponentType } from '../../game/opponent/Opponent.ts';
import { Ship, ShipModelType } from '../../game/Ship.ts';
import { TRADE_ITEM_COUNT } from '../../game/TradeItem.types.ts';
import { Travel } from '../../game/travel/Travel.ts';
import { topAlert } from './newGame.ts';

type Fitting = { weapons?: AccessoryType[]; gadgets?: AccessoryType[]; engineer?: number };

// An opponent in a bare ship of the given model, fitted with only what the test names.
export function opponentIn(
  type: OpponentType,
  model: ShipModelType,
  { weapons = [], gadgets = [], engineer = 5 }: Fitting = {}
): Opponent {
  const ship = Ship.create(model);
  weapons.forEach(weapon => ship.addWeaponOfType(weapon));
  gadgets.forEach(gadget => ship.addGadgetOfType(gadget));
  return Opponent.captain(type, engineer, 5, 5, 5, ship);
}

// The next opponent the trip generates is this one.
export function nextOpponentIs(opponent: Opponent): void {
  vi.spyOn(Opponent, 'generateOpponentWithType').mockReturnValue(opponent);
}

// Fits the commander's ship with a cloak that hides it from an engineer of skill 5 or less.
export function cloakCommander(game: Game): void {
  game.commander.ship.addGadgetOfType(AccessoryType.GadgetCloakingDevice);
  game.commander.engineer = 10;
}

// A cloak that hides the opponent from the commander, whose engineer has skill 5.
export const cloaked: Fitting = { gadgets: [AccessoryType.GadgetCloakingDevice], engineer: 10 };

// A trader whose hold holds exactly what a test puts in it.
export function traderWith(cargo: [number, number][]): Opponent {
  const trader = opponentIn(OpponentType.Trader, ShipModelType.Gnat);
  for (let type = 0; type < TRADE_ITEM_COUNT; type++) {
    trader.ship.soldQuantity(trader.ship.tradeItemQuantityForType(type), type);
  }
  cargo.forEach(([type, quantity]) => trader.ship.boughtQuantity(quantity, type, 0));
  return trader;
}

// An encounter whose owner records what it is told.
export function encounterWith(game: Game, type: EncounterType, opponent: Opponent) {
  const listener = {
    continues: vi.fn(),
    plundered: vi.fn(),
    hullChanged: vi.fn(),
    buttonsChanged: vi.fn(),
    arrested: vi.fn(),
    destroyed: vi.fn(),
  };
  return { encounter: new Encounter(type, game, opponent, listener), listener };
}

// A trip from the first system to the second, which reports how it ended.
export function tripFor(game: Game) {
  const [origin, destination] = game.solarSystems;
  const done = vi.fn();
  return { travel: new Travel(game, origin, destination, false, done), done };
}

// Dismisses one message after the other. Returns their texts, in the order shown; stops
// at a message that asks for something other than a dismissal.
export function dismissAll(): string[] {
  const texts: string[] = [];
  while (alertStore.open.length > 0) {
    const alert = topAlert();
    const dismiss = alert.actions.find(action => action.title === 'Dismiss');
    if (!dismiss) break;
    texts.push(alert.title);
    alert.press(dismiss);
  }
  return texts;
}
