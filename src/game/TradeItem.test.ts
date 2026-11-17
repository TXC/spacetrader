import { expect, test } from 'vitest';
import { tradeItemForType } from './TradeItem.ts';
import { Resource, Status, TechLevel, TradeItemType, TRADE_ITEM_COUNT } from './TradeItem.types.ts';

test('every trade item is in the table under its own number', () => {
  for (let type = 0; type < TRADE_ITEM_COUNT; type++) {
    expect(tradeItemForType(type).type).toBe(type);
  }
});

test('a trade item keeps the values the old game gave it', () => {
  expect(tradeItemForType(TradeItemType.Water)).toEqual({
    type: TradeItemType.Water,
    name: 'Water',
    techLevelToProduce: TechLevel.PreAgricultural,
    techLevelToUse: TechLevel.PreAgricultural,
    techLevelMaxProd: TechLevel.Medieval,
    priceLowTech: 30,
    priceIncreasePerTechLevel: 3,
    priceVariance: 4,
    minTradePrice: 30,
    maxTradePrice: 50,
    roundOffPrice: 1,
    doublePriceStatus: Status.Drought,
    cheapResource: Resource.SweetwaterOceans,
    expensiveResource: Resource.Desert,
  });
});
