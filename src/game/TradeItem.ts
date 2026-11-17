import { Resource, Status, TechLevel, TradeItemType } from './TradeItem.types.ts';

// One kind of cargo, and what decides its price in a system.
export type TradeItem = {
  readonly type: TradeItemType;
  readonly name: string;
  readonly techLevelToProduce: TechLevel;
  readonly techLevelToUse: TechLevel;
  readonly techLevelMaxProd: TechLevel;
  readonly priceLowTech: number;
  readonly priceIncreasePerTechLevel: number;
  readonly priceVariance: number;
  readonly minTradePrice: number;
  readonly maxTradePrice: number;
  readonly roundOffPrice: number;
  // The system status in which the price goes up by half, despite the name.
  readonly doublePriceStatus: Status;
  readonly cheapResource: Resource;
  readonly expensiveResource: Resource;
};

const ITEMS: Record<TradeItemType, TradeItem> = {
  [TradeItemType.Water]: {
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
  },
  [TradeItemType.Furs]: {
    type: TradeItemType.Furs,
    name: 'Furs',
    techLevelToProduce: TechLevel.PreAgricultural,
    techLevelToUse: TechLevel.PreAgricultural,
    techLevelMaxProd: TechLevel.PreAgricultural,
    priceLowTech: 250,
    priceIncreasePerTechLevel: 10,
    priceVariance: 10,
    minTradePrice: 230,
    maxTradePrice: 280,
    roundOffPrice: 5,
    doublePriceStatus: Status.ColdSpell,
    cheapResource: Resource.RichFauna,
    expensiveResource: Resource.Lifeless,
  },
  [TradeItemType.Food]: {
    type: TradeItemType.Food,
    name: 'Food',
    techLevelToProduce: TechLevel.Agricultural,
    techLevelToUse: TechLevel.PreAgricultural,
    techLevelMaxProd: TechLevel.Agricultural,
    priceLowTech: 100,
    priceIncreasePerTechLevel: 5,
    priceVariance: 5,
    minTradePrice: 90,
    maxTradePrice: 160,
    roundOffPrice: 5,
    doublePriceStatus: Status.CropFailure,
    cheapResource: Resource.RichSoil,
    expensiveResource: Resource.PoorSoil,
  },
  [TradeItemType.Ore]: {
    type: TradeItemType.Ore,
    name: 'Ore',
    techLevelToProduce: TechLevel.Medieval,
    techLevelToUse: TechLevel.Medieval,
    techLevelMaxProd: TechLevel.Renaissance,
    priceLowTech: 350,
    priceIncreasePerTechLevel: 20,
    priceVariance: 10,
    minTradePrice: 350,
    maxTradePrice: 420,
    roundOffPrice: 10,
    doublePriceStatus: Status.AtWar,
    cheapResource: Resource.MineralRich,
    expensiveResource: Resource.MineralPoor,
  },
  [TradeItemType.Games]: {
    type: TradeItemType.Games,
    name: 'Games',
    techLevelToProduce: TechLevel.Renaissance,
    techLevelToUse: TechLevel.Agricultural,
    techLevelMaxProd: TechLevel.PostIndustrial,
    priceLowTech: 250,
    priceIncreasePerTechLevel: -10,
    priceVariance: 5,
    minTradePrice: 160,
    maxTradePrice: 270,
    roundOffPrice: 5,
    doublePriceStatus: Status.Boredom,
    cheapResource: Resource.Artistic,
    expensiveResource: Resource.None,
  },
  [TradeItemType.Firearms]: {
    type: TradeItemType.Firearms,
    name: 'Firearms',
    techLevelToProduce: TechLevel.Renaissance,
    techLevelToUse: TechLevel.Agricultural,
    techLevelMaxProd: TechLevel.Industrial,
    priceLowTech: 1250,
    priceIncreasePerTechLevel: -75,
    priceVariance: 100,
    minTradePrice: 600,
    maxTradePrice: 1100,
    roundOffPrice: 25,
    doublePriceStatus: Status.AtWar,
    cheapResource: Resource.Warlike,
    expensiveResource: Resource.None,
  },
  [TradeItemType.Medicine]: {
    type: TradeItemType.Medicine,
    name: 'Medicine',
    techLevelToProduce: TechLevel.EarlyIndustrial,
    techLevelToUse: TechLevel.Agricultural,
    techLevelMaxProd: TechLevel.PostIndustrial,
    priceLowTech: 650,
    priceIncreasePerTechLevel: -20,
    priceVariance: 10,
    minTradePrice: 400,
    maxTradePrice: 700,
    roundOffPrice: 25,
    doublePriceStatus: Status.Plague,
    cheapResource: Resource.SpecialHerbs,
    expensiveResource: Resource.None,
  },
  [TradeItemType.Machines]: {
    type: TradeItemType.Machines,
    name: 'Machines',
    techLevelToProduce: TechLevel.EarlyIndustrial,
    techLevelToUse: TechLevel.Renaissance,
    techLevelMaxProd: TechLevel.Industrial,
    priceLowTech: 900,
    priceIncreasePerTechLevel: -30,
    priceVariance: 5,
    minTradePrice: 600,
    maxTradePrice: 800,
    roundOffPrice: 25,
    doublePriceStatus: Status.LackWorkers,
    cheapResource: Resource.None,
    expensiveResource: Resource.None,
  },
  [TradeItemType.Narcotics]: {
    type: TradeItemType.Narcotics,
    name: 'Narcotics',
    techLevelToProduce: TechLevel.Industrial,
    techLevelToUse: TechLevel.PreAgricultural,
    techLevelMaxProd: TechLevel.Industrial,
    priceLowTech: 3500,
    priceIncreasePerTechLevel: -125,
    priceVariance: 150,
    minTradePrice: 2000,
    maxTradePrice: 3000,
    roundOffPrice: 50,
    doublePriceStatus: Status.Boredom,
    cheapResource: Resource.WeirdMushrooms,
    expensiveResource: Resource.None,
  },
  [TradeItemType.Robots]: {
    type: TradeItemType.Robots,
    name: 'Robots',
    techLevelToProduce: TechLevel.PostIndustrial,
    techLevelToUse: TechLevel.EarlyIndustrial,
    techLevelMaxProd: TechLevel.HighTech,
    priceLowTech: 5000,
    priceIncreasePerTechLevel: -150,
    priceVariance: 100,
    minTradePrice: 3500,
    maxTradePrice: 5000,
    roundOffPrice: 100,
    doublePriceStatus: Status.LackWorkers,
    cheapResource: Resource.None,
    expensiveResource: Resource.None,
  },
};

// The trade item with this number. Only the ten kinds that can be traded have one.
export function tradeItemForType(type: number): TradeItem {
  return ITEMS[type as TradeItemType];
}
