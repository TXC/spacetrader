export const TechLevel = {
  PreAgricultural: 0,
  Agricultural: 1,
  Medieval: 2,
  Renaissance: 3,
  EarlyIndustrial: 4,
  Industrial: 5,
  PostIndustrial: 6,
  HighTech: 7,
  Count: 8,
} as const;
export type TechLevel = (typeof TechLevel)[keyof typeof TechLevel];

export const TECH_LEVEL_STR = (x: number) => {
  switch (x) {
    case TechLevel.PreAgricultural:
      return 'Pre-Agricultural';
    case TechLevel.Agricultural:
      return 'Agricultural';
    case TechLevel.Medieval:
      return 'Medieval';
    case TechLevel.Renaissance:
      return 'Renaissance';
    case TechLevel.EarlyIndustrial:
      return 'Early Industrial';
    case TechLevel.Industrial:
      return 'Industrial';
    case TechLevel.PostIndustrial:
      return 'Post-Industrial';
    case TechLevel.HighTech:
      return 'High-Tech';
    default:
      return '';
  }
};

export const Status = {
  Uneventful: 0,
  AtWar: 1,
  Plague: 2,
  Drought: 3,
  Boredom: 4,
  ColdSpell: 5,
  CropFailure: 6,
  LackWorkers: 7,
  Count: 8,
} as const;
export type Status = (typeof Status)[keyof typeof Status];

export const STATUS_STR = (x: number) => {
  switch (x) {
    case Status.Uneventful:
      return 'under no particular pressure';
    case Status.AtWar:
      return 'at war';
    case Status.Plague:
      return 'ravaged by a plague';
    case Status.Drought:
      return 'suffering from a drought';
    case Status.Boredom:
      return 'suffering from extreme boredom';
    case Status.ColdSpell:
      return 'suffering from a cold spell';
    case Status.CropFailure:
      return 'suffering from crop failure';
    case Status.LackWorkers:
      return 'lacking enough workers';
    default:
      return '';
  }
};

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
  Count: 13,
} as const;
export type Resource = (typeof Resource)[keyof typeof Resource];

export const RESOURCES_STR = (x: number) => {
  switch (x) {
    case Resource.None:
      return 'Nothing special';
    case Resource.MineralRich:
      return 'Mineral rich';
    case Resource.MineralPoor:
      return 'Mineral poor';
    case Resource.Desert:
      return 'Desert';
    case Resource.SweetwaterOceans:
      return 'Sweetwater oceans';
    case Resource.RichSoil:
      return 'Rich soil';
    case Resource.PoorSoil:
      return 'Poor soil';
    case Resource.RichFauna:
      return 'Rich fauna';
    case Resource.Lifeless:
      return 'Lifeless';
    case Resource.WeirdMushrooms:
      return 'Weird mushrooms';
    case Resource.SpecialHerbs:
      return 'Special herbs';
    case Resource.Artistic:
      return 'Artistic populace';
    case Resource.Warlike:
      return 'Warlike populace';
    default:
      return '';
  }
};

export const TradeItemType = {
  None: -1,
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
  Count: 10,
  FakeQuestCargoStart: 11,
  FakeQuestCargo: 11,
  FakeQuestCargoReactor: 12,
} as const;
export type TradeItemType = (typeof TradeItemType)[keyof typeof TradeItemType];

export const TRADE_ITEM_IS_ILLEGAL = (x: number) => {
  return x === TradeItemType.Firearms || x === TradeItemType.Narcotics;
};
