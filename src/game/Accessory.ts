import { TechLevel, NOT_FOR_SALE } from './TradeItem.types.ts';

export const AccessoryType = {
  // Gadgets
  GadgetFiveExtraCargoBays: 0,
  GadgetAutoRepairSystem: 1,
  GadgetNavigationSystem: 2,
  GadgetTargetingSystem: 3,
  GadgetCloakingDevice: 4,
  GadgetFuelCompactor: 5, // Can't be bought

  GadgetFirst: 0,
  GadgetLastBuyable: 4,
  GadgetLast: 5,

  // Weapons
  WeaponPulseLaser: 6,
  WeaponBeamLaser: 7,
  WeaponMilitaryLaser: 8,
  WeaponMorgansLaser: 9, // Can't be bought

  WeaponFirst: 6,
  WeaponLastBuyable: 8,
  WeaponLast: 9,

  // Shields
  ShieldEnergy: 10,
  ShieldReflective: 11,
  ShieldLightning: 12, // Can't be bought

  ShieldFirst: 10,
  ShieldLastBuyable: 11,
  ShieldLast: 12,

  None: 13,
} as const;
export type AccessoryType = (typeof AccessoryType)[keyof typeof AccessoryType];

export const COUNT_BUYABLE_ACCESSORIES =
  AccessoryType.GadgetLastBuyable -
  AccessoryType.GadgetFirst +
  1 +
  (AccessoryType.WeaponLastBuyable - AccessoryType.WeaponFirst + 1) +
  (AccessoryType.ShieldLastBuyable - AccessoryType.ShieldFirst + 1);

type AccessorySpec = {
  type: number;
  name: string;
  price: number;
  techLevel: TechLevel | typeof NOT_FOR_SALE;
  occurrence: number;
};
type PoweredSpec = AccessorySpec & { power: number };

// A piece of equipment a ship can carry: a gadget, a weapon or a shield.
export class Accessory {
  declare readonly type: number;
  declare readonly name: string;
  declare readonly price: number;
  declare readonly techLevel: TechLevel | typeof NOT_FOR_SALE;
  declare readonly occurrence: number;

  constructor(spec: AccessorySpec) {
    Object.assign(this, spec);
  }

  // The word for this kind of equipment, as in "You have no available gadget slots."
  get category(): string {
    return 'accessory';
  }
}

export class Gadget extends Accessory {
  override get category() {
    return 'gadget';
  }

  get isBuyable() {
    return this.type <= AccessoryType.GadgetLastBuyable;
  }
}

export class Weapon extends Accessory {
  declare readonly power: number;

  constructor(spec: PoweredSpec) {
    super(spec);
  }

  override get category() {
    return 'weapon';
  }

  get isBuyable() {
    return this.type <= AccessoryType.WeaponLastBuyable;
  }
}

export class Shield extends Accessory {
  declare readonly power: number;

  constructor(spec: PoweredSpec) {
    super(spec);
  }

  override get category() {
    return 'shield';
  }

  get isBuyable() {
    return this.type <= AccessoryType.ShieldLastBuyable;
  }
}

function byType<T extends Accessory>(items: T[]): Map<number, T> {
  return new Map(items.map(item => [item.type, item]));
}

const GADGETS = byType([
  new Gadget({
    type: AccessoryType.GadgetFiveExtraCargoBays,
    name: '5 extra cargo bays',
    price: 2500,
    techLevel: TechLevel.EarlyIndustrial,
    occurrence: 35,
  }),
  new Gadget({
    type: AccessoryType.GadgetAutoRepairSystem,
    name: 'Auto-repair system',
    price: 7500,
    techLevel: TechLevel.Industrial,
    occurrence: 20,
  }),
  new Gadget({
    type: AccessoryType.GadgetNavigationSystem,
    name: 'Navigation system',
    price: 15000,
    techLevel: TechLevel.PostIndustrial,
    occurrence: 20,
  }),
  new Gadget({
    type: AccessoryType.GadgetTargetingSystem,
    name: 'Targeting system',
    price: 25000,
    techLevel: TechLevel.PostIndustrial,
    occurrence: 20,
  }),
  new Gadget({
    type: AccessoryType.GadgetCloakingDevice,
    name: 'Cloaking device',
    price: 100000,
    techLevel: TechLevel.HighTech,
    occurrence: 5,
  }),
  new Gadget({
    type: AccessoryType.GadgetFuelCompactor,
    name: 'Fuel compactor',
    price: 30000,
    techLevel: NOT_FOR_SALE,
    occurrence: 0,
  }),
]);

const WEAPONS = byType([
  new Weapon({
    type: AccessoryType.WeaponPulseLaser,
    name: 'Pulse laser',
    price: 2000,
    techLevel: TechLevel.Industrial,
    occurrence: 50,
    power: 15,
  }),
  new Weapon({
    type: AccessoryType.WeaponBeamLaser,
    name: 'Beam laser',
    price: 12500,
    techLevel: TechLevel.PostIndustrial,
    occurrence: 35,
    power: 25,
  }),
  new Weapon({
    type: AccessoryType.WeaponMilitaryLaser,
    name: 'Military laser',
    price: 35000,
    techLevel: TechLevel.HighTech,
    occurrence: 15,
    power: 35,
  }),
  new Weapon({
    type: AccessoryType.WeaponMorgansLaser,
    name: "Morgan's laser",
    price: 50000,
    techLevel: NOT_FOR_SALE,
    occurrence: 0,
    power: 85,
  }),
]);

const SHIELDS = byType([
  new Shield({
    type: AccessoryType.ShieldEnergy,
    name: 'Energy shield',
    price: 5000,
    techLevel: TechLevel.Industrial,
    occurrence: 70,
    power: 100,
  }),
  new Shield({
    type: AccessoryType.ShieldReflective,
    name: 'Reflective shield',
    price: 20000,
    techLevel: TechLevel.PostIndustrial,
    occurrence: 30,
    power: 200,
  }),
  new Shield({
    type: AccessoryType.ShieldLightning,
    name: 'Lightning shield',
    price: 45000,
    techLevel: NOT_FOR_SALE,
    occurrence: 0,
    power: 350,
  }),
]);

// Each lookup finds only its own kind of equipment; any other number gives undefined.
export const gadgetForType = (type: number) => GADGETS.get(type);
export const weaponForType = (type: number) => WEAPONS.get(type);
export const shieldForType = (type: number) => SHIELDS.get(type);

export function ACCESSORY_FOR_TYPE(type: number) {
  return gadgetForType(type) || weaponForType(type) || shieldForType(type);
}
