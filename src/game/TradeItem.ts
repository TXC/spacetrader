import { Resource, Status, TechLevel, TradeItemType } from './TradeItem.types.ts'

export const sItems: Record<number, TradeItem> = {};

export class TradeItem {
    declare type: TradeItemType
    declare name: string
    declare icon: string
    declare techLevelToProduce: TechLevel
    declare techLevelToUse: TechLevel
    declare techLevelMaxProd: TechLevel
    declare priceLowTech: number
    declare priceIncreasePerTechLevel: number
    declare priceVariance: number
    declare minTradePrice: number
    declare maxTradePrice: number
    declare roundOffPrice: number
    declare doublePriceStatus: Status
    declare cheapResource: Resource
    declare expensiveResource: Resource

    constructor(type: TradeItemType, name: string, icon: string, techLevelToProduce: TechLevel, techLevelToUse: TechLevel, techLevelMaxProd: TechLevel, priceLowTech: number, priceIncreasePerTechLevel: number, priceVariance: number, minTradePrice: number, maxTradePrice: number, roundOffPrice: number, doublePriceStatus: Status, cheapResource: Resource, expensiveResource: Resource) {
        this.type = type;
        this.name = name;
        this.icon = icon;
        this.techLevelToProduce = techLevelToProduce;
        this.techLevelToUse = techLevelToUse;
        this.techLevelMaxProd = techLevelMaxProd;
        this.priceLowTech = priceLowTech;
        this.priceIncreasePerTechLevel = priceIncreasePerTechLevel;
        this.priceVariance = priceVariance;
        this.minTradePrice = minTradePrice;
        this.maxTradePrice = maxTradePrice;
        this.roundOffPrice = roundOffPrice;
        this.doublePriceStatus = doublePriceStatus;
        this.cheapResource = cheapResource;
        this.expensiveResource = expensiveResource;
    }

    static tradeItemForType(tradeItemType: number): TradeItem | null {
        if (!sItems[tradeItemType]) {
            let item;
            switch (tradeItemType) {
                case TradeItemType.Water:
                    item = new TradeItem(tradeItemType, "Water", "", TechLevel.PreAgricultural, TechLevel.PreAgricultural, TechLevel.Medieval, 30, 3, 4, 30, 50, 1, Status.Drought, Resource.SweetwaterOceans, Resource.Desert);
                    break;
                case TradeItemType.Furs:
                    item = new TradeItem(tradeItemType, "Furs", "", TechLevel.PreAgricultural, TechLevel.PreAgricultural, TechLevel.PreAgricultural, 250, 10, 10, 230, 280, 5, Status.ColdSpell, Resource.RichFauna, Resource.Lifeless);
                    break;
                case TradeItemType.Food:
                    item = new TradeItem(tradeItemType, "Food", "", TechLevel.Agricultural, TechLevel.PreAgricultural, TechLevel.Agricultural, 100, 5, 5, 90, 160, 5, Status.CropFailure, Resource.RichSoil, Resource.PoorSoil);
                    break;
                case TradeItemType.Ore:
                    item = new TradeItem(tradeItemType, "Ore", "", TechLevel.Medieval, TechLevel.Medieval, TechLevel.Renaissance, 350, 20, 10, 350, 420, 10, Status.AtWar, Resource.MineralRich, Resource.MineralPoor);
                    break;
                case TradeItemType.Games:
                    item = new TradeItem(tradeItemType, "Games", "", TechLevel.Renaissance, TechLevel.Agricultural, TechLevel.PostIndustrial, 250, -10, 5, 160, 270, 5, Status.Boredom, Resource.Artistic, Resource.None);
                    break;
                case TradeItemType.Firearms:
                    item = new TradeItem(tradeItemType, "Firearms", "", TechLevel.Renaissance, TechLevel.Agricultural, TechLevel.Industrial, 1250, -75, 100, 600, 1100, 25, Status.AtWar, Resource.Warlike, Resource.None);
                    break;
                case TradeItemType.Medicine:
                    item = new TradeItem(tradeItemType, "Medicine", "", TechLevel.EarlyIndustrial, TechLevel.Agricultural, TechLevel.PostIndustrial, 650, -20, 10, 400, 700, 25, Status.Plague, Resource.SpecialHerbs, Resource.None);
                    break;
                case TradeItemType.Machines:
                    item = new TradeItem(tradeItemType, "Machines", "", TechLevel.EarlyIndustrial, TechLevel.Renaissance, TechLevel.Industrial, 900, -30, 5, 600, 800, 25, Status.LackWorkers, Resource.None, Resource.None);
                    break;
                case TradeItemType.Narcotics:
                    item = new TradeItem(tradeItemType, "Narcotics", "", TechLevel.Industrial, TechLevel.PreAgricultural, TechLevel.Industrial, 3500, -125, 150, 2000, 3000, 50, Status.Boredom, Resource.WeirdMushrooms, Resource.None);
                    break;
                case TradeItemType.Robots:
                    item = new TradeItem(tradeItemType, "Robots", "", TechLevel.PostIndustrial, TechLevel.EarlyIndustrial, TechLevel.HighTech, 5000, -150, 100, 3500, 5000, 100, Status.LackWorkers, Resource.None, Resource.None);
                    break;
                default:
                    return null;
            }
            if (item) {
                sItems[tradeItemType] = item;
            }
        }
        return sItems[tradeItemType];
    };

}
