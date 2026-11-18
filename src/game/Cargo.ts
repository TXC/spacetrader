// What the buy and sell cargo screens show, and what their buttons do.
import type { Game } from './Game.ts';
import type { SolarSystem } from './SolarSystem.ts';
import { tradeItemForType } from './TradeItem.ts';
import { TRADE_ITEM_COUNT } from './TradeItem.types.ts';

export type CargoRow = {
  type: number;
  name: string;
  bold: boolean; // worth trading: shown in bold
  quantity: number; // on sale here (buying) or in the hold (selling)
  cost: string;
  verb: 'Buy' | 'Sell' | 'Dump';
  enabled: boolean;
};

// `baseSystem` is set on the warp screen, which shows average prices at the destination.
export type CargoView = { buy: boolean; baseSystem?: SolarSystem; relative: boolean };

// "+$12", "-$3" or "$40"; empty when there is nothing worth showing.
export function costLabel(relative: boolean, price: number, sellPrice: number): string {
  const show = (relative && sellPrice !== 0) || price !== 0;
  if (!show) return '';
  const sign = !relative || price === 0 ? '' : price > 0 ? '+' : '-';
  return `${sign}$${Math.abs(price)}`;
}

function prices(game: Game, view: CargoView, type: number) {
  const { commander } = game;
  const base = view.baseSystem;
  return {
    buy: base ? base.standardPriceForItem(type) : commander.buyPriceForItem(type),
    sell: base ? base.standardPriceForItem(type) : commander.sellPriceForItem(type),
    average: base
      ? commander.buyPriceForItem(type)
      : commander.ship.tradeItemAverageBuyingPriceForType(type),
  };
}

function cargoRow(game: Game, view: CargoView, type: number): CargoRow {
  const price = prices(game, view, type);
  const toBuy = game.commander.getCurrentSystem().tradeItemQuantityForType(type);
  const toSell = game.commander.ship.tradeItemQuantityForType(type);
  const quantity = view.buy ? toBuy : toSell;
  const profitable = price.sell > price.average && quantity > 0;
  const shown = view.relative ? price.sell - price.average : view.buy ? price.buy : price.sell;
  return {
    type,
    name: tradeItemForType(type).name,
    bold: profitable && (view.buy ? !!view.baseSystem : true),
    quantity,
    cost: costLabel(view.relative, shown, price.sell),
    verb: view.buy ? 'Buy' : price.sell === 0 && toSell > 0 ? 'Dump' : 'Sell',
    enabled: quantity > 0,
  };
}

export function cargoRows(game: Game, view: CargoView): CargoRow[] {
  return Array.from({ length: TRADE_ITEM_COUNT }, (_, type) => cargoRow(game, view, type));
}

export function buyCargo(game: Game, type: number, quantity: number): 'ok' | 'debtTooLarge' {
  if (game.commander.debtIsTooLargeToBuy()) return 'debtTooLarge';
  game.commander.attemptPurchaseOfItem(type, quantity);
  game.save();
  return 'ok';
}

export function sellCargo(game: Game, type: number, quantity: number): void {
  game.commander.attemptSaleOfItem(type, quantity, false);
  game.save();
}
