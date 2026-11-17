import { named, countOf } from './texts.ts';
import type { ValueOf } from './texts.ts';

export const TechLevel = {
  PreAgricultural: 0,
  Agricultural: 1,
  Medieval: 2,
  Renaissance: 3,
  EarlyIndustrial: 4,
  Industrial: 5,
  PostIndustrial: 6,
  HighTech: 7,
} as const;
export type TechLevel = ValueOf<typeof TechLevel>;
export const TECH_LEVEL_COUNT = countOf(TechLevel);

// The "tech level" of ships and equipment that no system sells: one above the highest.
export const NOT_FOR_SALE = 8;

// The name of a tech level, as shown for a system.
export const techLevelName = named<TechLevel>({
  [TechLevel.PreAgricultural]: 'Pre-Agricultural',
  [TechLevel.Agricultural]: 'Agricultural',
  [TechLevel.Medieval]: 'Medieval',
  [TechLevel.Renaissance]: 'Renaissance',
  [TechLevel.EarlyIndustrial]: 'Early Industrial',
  [TechLevel.Industrial]: 'Industrial',
  [TechLevel.PostIndustrial]: 'Post-Industrial',
  [TechLevel.HighTech]: 'High-Tech',
});

export const Status = {
  Uneventful: 0,
  AtWar: 1,
  Plague: 2,
  Drought: 3,
  Boredom: 4,
  ColdSpell: 5,
  CropFailure: 6,
  LackWorkers: 7,
} as const;
export type Status = ValueOf<typeof Status>;
export const STATUS_COUNT = countOf(Status);

// What a system in this status is going through, to finish "This system is ...".
export const statusDescription = named<Status>({
  [Status.Uneventful]: 'under no particular pressure',
  [Status.AtWar]: 'at war',
  [Status.Plague]: 'ravaged by a plague',
  [Status.Drought]: 'suffering from a drought',
  [Status.Boredom]: 'suffering from extreme boredom',
  [Status.ColdSpell]: 'suffering from a cold spell',
  [Status.CropFailure]: 'suffering from crop failure',
  [Status.LackWorkers]: 'lacking enough workers',
});

export const Resource = {
  None: 0,
  MineralRich: 1,
  MineralPoor: 2,
  Desert: 3,
  SweetwaterOceans: 4,
  RichSoil: 5,
  PoorSoil: 6,
  RichFauna: 7,
  Lifeless: 8,
  WeirdMushrooms: 9,
  SpecialHerbs: 10,
  Artistic: 11,
  Warlike: 12,
} as const;
export type Resource = ValueOf<typeof Resource>;
export const RESOURCE_COUNT = countOf(Resource);

// The name of a system's special resource.
export const resourceName = named<Resource>({
  [Resource.None]: 'Nothing special',
  [Resource.MineralRich]: 'Mineral rich',
  [Resource.MineralPoor]: 'Mineral poor',
  [Resource.Desert]: 'Desert',
  [Resource.SweetwaterOceans]: 'Sweetwater oceans',
  [Resource.RichSoil]: 'Rich soil',
  [Resource.PoorSoil]: 'Poor soil',
  [Resource.RichFauna]: 'Rich fauna',
  [Resource.Lifeless]: 'Lifeless',
  [Resource.WeirdMushrooms]: 'Weird mushrooms',
  [Resource.SpecialHerbs]: 'Special herbs',
  [Resource.Artistic]: 'Artistic populace',
  [Resource.Warlike]: 'Warlike populace',
});

export const TradeItemType = {
  Water: 0,
  Furs: 1,
  Food: 2,
  Ore: 3,
  Games: 4,
  Firearms: 5,
  Medicine: 6,
  Machines: 7,
  Narcotics: 8,
  Robots: 9,
} as const;
export type TradeItemType = ValueOf<typeof TradeItemType>;
export const TRADE_ITEM_COUNT = countOf(TradeItemType);

// "No trade item", where one is optional.
export const NO_TRADE_ITEM = -1;

// Quest cargo takes up bays like goods do, but cannot be traded. Its numbers start above
// the goods.
export const FAKE_QUEST_CARGO_START = 11;
export const FAKE_QUEST_CARGO = 11; // the antidote for Japori
export const FAKE_QUEST_CARGO_REACTOR = 12;

const ILLEGAL: readonly number[] = [TradeItemType.Firearms, TradeItemType.Narcotics];

export function isIllegalTradeItem(type: number): boolean {
  return ILLEGAL.includes(type);
}
