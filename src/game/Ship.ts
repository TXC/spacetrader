import { countOf } from './texts.ts';
import type { ValueOf } from './texts.ts';
import { PCEImageLibrary } from './Images.ts';
import { PCEImage } from './PCEImage.ts';
import {
  accessoryForType,
  AccessoryType,
  gadgetForType,
  shieldForType,
  weaponForType,
} from './Accessory.ts';
import type { Accessory, Gadget, Shield, Weapon } from './Accessory.ts';
import type { SolarSystem } from './SolarSystem.ts';
import { CrewMember } from './CrewMember.ts';
import { adjustSkillForDifficulty, CLOAK_BONUS, SKILL_BONUS } from './SolarSystem.types.ts';
import {
  TechLevel,
  TradeItemType,
  isIllegalTradeItem,
  FAKE_QUEST_CARGO_REACTOR,
  FAKE_QUEST_CARGO_START,
  NO_TRADE_ITEM,
  NOT_FOR_SALE,
  TRADE_ITEM_COUNT,
} from './TradeItem.types.ts';
import {
  ensureArrayOrNull,
  ensureBool,
  ensureInteger,
  ensureMapOrNull,
  ensureType,
} from './ensure.ts';
import { pLog } from './probes.ts';
import { runtime } from './runtime.ts';

export const ShipModelType = {
  Flea: 0,
  Gnat: 1,
  Firefly: 2,
  Mosquito: 3,
  Bumblebee: 4,
  Beetle: 5,
  Hornet: 6,
  Grasshopper: 7,
  Termite: 8,
  Wasp: 9,

  Best: 9, // Equivalent to ShipModelTypeWasp

  // Can't be bought
  SpaceMonster: 10,
  Dragonfly: 11,
  Mantis: 12,
  Scarab: 13,
  Bottle: 14,
} as const;
export type ShipModelType = ValueOf<typeof ShipModelType>;
export const SHIP_MODEL_COUNT = countOf(ShipModelType);

export const MAX_TRIBBLES = 100000;

import type { ShipState } from './savedGame.ts';
export type { ShipState };

// An opponent or commander together with the ship they fly.
type ShipOwner = CrewMember & { ship: Ship };

// What the game knows about a ship model: its room, its price and how often each kind of
// opponent flies it.
type ShipModelSpec = Omit<ShipModel, 'mercenaryQuarters' | 'shipImage' | '_shipImage'>;

export class ShipModel {
  declare type: ShipModelType;
  declare name: string;
  declare cargoBays: number;
  declare weaponSlots: number;
  declare shieldSlots: number;
  declare gadgetSlots: number;
  declare crewQuarters: number;
  declare fuelTanks: number;
  declare minTechLevel: TechLevel | typeof NOT_FOR_SALE;
  declare costOfFuel: number;
  declare price: number;
  declare bounty: number;
  declare frequency: number;
  declare hullStrength: number;
  declare police: number;
  declare pirates: number;
  declare traders: number;
  declare repairCosts: number;
  declare size: number;
  declare _shipImage?: PCEImage;

  constructor(spec: ShipModelSpec) {
    Object.assign(this, spec);
  }

  mercenaryQuarters() {
    return this.crewQuarters - 1;
  }

  get shipImage() {
    if (!this._shipImage) {
      this._shipImage = new PCEImage(
        (PCEImageLibrary as unknown as Record<string, { imageStr: string }>)[
          this.name.toLowerCase().replace(/\s+/g, '')
        ].imageStr
      );
    }

    return this._shipImage;
  }
}

const MODELS: Record<ShipModelType, ShipModel> = {
  [ShipModelType.Flea]: new ShipModel({
    type: ShipModelType.Flea,
    name: 'Flea',
    cargoBays: 10,
    weaponSlots: 0,
    shieldSlots: 0,
    gadgetSlots: 0,
    crewQuarters: 1,
    fuelTanks: 20,
    minTechLevel: TechLevel.EarlyIndustrial,
    costOfFuel: 1,
    price: 2000,
    bounty: 5,
    frequency: 2,
    hullStrength: 25,
    police: -1,
    pirates: -1,
    traders: 0,
    repairCosts: 1,
    size: 0,
  }),
  [ShipModelType.Gnat]: new ShipModel({
    type: ShipModelType.Gnat,
    name: 'Gnat',
    cargoBays: 15,
    weaponSlots: 1,
    shieldSlots: 0,
    gadgetSlots: 1,
    crewQuarters: 1,
    fuelTanks: 14,
    minTechLevel: TechLevel.Industrial,
    costOfFuel: 2,
    price: 10000,
    bounty: 50,
    frequency: 28,
    hullStrength: 100,
    police: 0,
    pirates: 0,
    traders: 0,
    repairCosts: 1,
    size: 1,
  }),
  [ShipModelType.Firefly]: new ShipModel({
    type: ShipModelType.Firefly,
    name: 'Firefly',
    cargoBays: 20,
    weaponSlots: 1,
    shieldSlots: 1,
    gadgetSlots: 1,
    crewQuarters: 1,
    fuelTanks: 17,
    minTechLevel: TechLevel.Industrial,
    costOfFuel: 3,
    price: 25000,
    bounty: 75,
    frequency: 20,
    hullStrength: 100,
    police: 0,
    pirates: 0,
    traders: 0,
    repairCosts: 1,
    size: 1,
  }),
  [ShipModelType.Mosquito]: new ShipModel({
    type: ShipModelType.Mosquito,
    name: 'Mosquito',
    cargoBays: 15,
    weaponSlots: 2,
    shieldSlots: 1,
    gadgetSlots: 1,
    crewQuarters: 1,
    fuelTanks: 13,
    minTechLevel: TechLevel.Industrial,
    costOfFuel: 5,
    price: 30000,
    bounty: 100,
    frequency: 20,
    hullStrength: 100,
    police: 0,
    pirates: 1,
    traders: 0,
    repairCosts: 1,
    size: 1,
  }),
  [ShipModelType.Bumblebee]: new ShipModel({
    type: ShipModelType.Bumblebee,
    name: 'Bumblebee',
    cargoBays: 25,
    weaponSlots: 1,
    shieldSlots: 2,
    gadgetSlots: 2,
    crewQuarters: 2,
    fuelTanks: 15,
    minTechLevel: TechLevel.Industrial,
    costOfFuel: 7,
    price: 60000,
    bounty: 125,
    frequency: 15,
    hullStrength: 100,
    police: 1,
    pirates: 1,
    traders: 0,
    repairCosts: 1,
    size: 2,
  }),
  [ShipModelType.Beetle]: new ShipModel({
    type: ShipModelType.Beetle,
    name: 'Beetle',
    cargoBays: 50,
    weaponSlots: 0,
    shieldSlots: 1,
    gadgetSlots: 1,
    crewQuarters: 3,
    fuelTanks: 14,
    minTechLevel: TechLevel.Industrial,
    costOfFuel: 10,
    price: 80000,
    bounty: 50,
    frequency: 3,
    hullStrength: 50,
    police: -1,
    pirates: -1,
    traders: 0,
    repairCosts: 1,
    size: 2,
  }),
  [ShipModelType.Hornet]: new ShipModel({
    type: ShipModelType.Hornet,
    name: 'Hornet',
    cargoBays: 20,
    weaponSlots: 3,
    shieldSlots: 2,
    gadgetSlots: 1,
    crewQuarters: 2,
    fuelTanks: 16,
    minTechLevel: TechLevel.PostIndustrial,
    costOfFuel: 15,
    price: 100000,
    bounty: 200,
    frequency: 6,
    hullStrength: 150,
    police: 2,
    pirates: 3,
    traders: 1,
    repairCosts: 2,
    size: 3,
  }),
  [ShipModelType.Grasshopper]: new ShipModel({
    type: ShipModelType.Grasshopper,
    name: 'Grasshopper',
    cargoBays: 30,
    weaponSlots: 2,
    shieldSlots: 2,
    gadgetSlots: 3,
    crewQuarters: 3,
    fuelTanks: 15,
    minTechLevel: TechLevel.PostIndustrial,
    costOfFuel: 15,
    price: 150000,
    bounty: 300,
    frequency: 2,
    hullStrength: 150,
    police: 3,
    pirates: 4,
    traders: 2,
    repairCosts: 3,
    size: 3,
  }),
  [ShipModelType.Termite]: new ShipModel({
    type: ShipModelType.Termite,
    name: 'Termite',
    cargoBays: 60,
    weaponSlots: 1,
    shieldSlots: 3,
    gadgetSlots: 2,
    crewQuarters: 3,
    fuelTanks: 13,
    minTechLevel: TechLevel.HighTech,
    costOfFuel: 20,
    price: 225000,
    bounty: 300,
    frequency: 2,
    hullStrength: 200,
    police: 4,
    pirates: 4,
    traders: 3,
    repairCosts: 4,
    size: 4,
  }),
  [ShipModelType.Wasp]: new ShipModel({
    type: ShipModelType.Wasp,
    name: 'Wasp',
    cargoBays: 35,
    weaponSlots: 3,
    shieldSlots: 2,
    gadgetSlots: 2,
    crewQuarters: 3,
    fuelTanks: 14,
    minTechLevel: TechLevel.HighTech,
    costOfFuel: 20,
    price: 300000,
    bounty: 500,
    frequency: 2,
    hullStrength: 200,
    police: 5,
    pirates: 6,
    traders: 4,
    repairCosts: 5,
    size: 4,
  }),
  [ShipModelType.SpaceMonster]: new ShipModel({
    type: ShipModelType.SpaceMonster,
    name: 'Space Monster',
    cargoBays: 0,
    weaponSlots: 3,
    shieldSlots: 0,
    gadgetSlots: 0,
    crewQuarters: 1,
    fuelTanks: 1,
    minTechLevel: NOT_FOR_SALE,
    costOfFuel: 1,
    price: 500000,
    bounty: 0,
    frequency: 0,
    hullStrength: 500,
    police: 8,
    pirates: 8,
    traders: 8,
    repairCosts: 1,
    size: 4,
  }),
  [ShipModelType.Dragonfly]: new ShipModel({
    type: ShipModelType.Dragonfly,
    name: 'Dragonfly',
    cargoBays: 0,
    weaponSlots: 2,
    shieldSlots: 3,
    gadgetSlots: 2,
    crewQuarters: 1,
    fuelTanks: 1,
    minTechLevel: NOT_FOR_SALE,
    costOfFuel: 1,
    price: 500000,
    bounty: 0,
    frequency: 0,
    hullStrength: 10,
    police: 8,
    pirates: 8,
    traders: 8,
    repairCosts: 1,
    size: 1,
  }),
  [ShipModelType.Mantis]: new ShipModel({
    type: ShipModelType.Mantis,
    name: 'Mantis',
    cargoBays: 0,
    weaponSlots: 3,
    shieldSlots: 1,
    gadgetSlots: 3,
    crewQuarters: 3,
    fuelTanks: 1,
    minTechLevel: NOT_FOR_SALE,
    costOfFuel: 1,
    price: 500000,
    bounty: 0,
    frequency: 0,
    hullStrength: 300,
    police: 8,
    pirates: 8,
    traders: 8,
    repairCosts: 1,
    size: 2,
  }),
  [ShipModelType.Scarab]: new ShipModel({
    type: ShipModelType.Scarab,
    name: 'Scarab',
    cargoBays: 20,
    weaponSlots: 2,
    shieldSlots: 0,
    gadgetSlots: 0,
    crewQuarters: 2,
    fuelTanks: 1,
    minTechLevel: NOT_FOR_SALE,
    costOfFuel: 1,
    price: 500000,
    bounty: 0,
    frequency: 0,
    hullStrength: 400,
    police: 8,
    pirates: 8,
    traders: 8,
    repairCosts: 1,
    size: 3,
  }),
  [ShipModelType.Bottle]: new ShipModel({
    type: ShipModelType.Bottle,
    name: 'Bottle',
    cargoBays: 0,
    weaponSlots: 0,
    shieldSlots: 0,
    gadgetSlots: 0,
    crewQuarters: 0,
    fuelTanks: 1,
    minTechLevel: NOT_FOR_SALE,
    costOfFuel: 1,
    price: 100,
    bounty: 0,
    frequency: 0,
    hullStrength: 0,
    police: 8,
    pirates: 8,
    traders: 8,
    repairCosts: 1,
    size: 1,
  }),
};

// The model with this number, as a saved game stores it.
export function shipModelForType(type: number): ShipModel {
  return MODELS[type as ShipModelType];
}

export class Ship {
  declare _type: ShipModelType;
  declare _difficulty: number;
  declare _fuel: number;
  declare _hull: number;
  declare _upgradedHull: boolean;
  declare _currentShieldPower: number;
  declare _cargoBuyingPrice: Map<number, number>;
  declare _cargo: Map<number, number>;
  declare _weapons: Weapon[];
  declare _shields: Shield[];
  declare _gadgets: Gadget[];
  declare _crew: CrewMember[];
  declare tribbles: number;

  constructor(type: number, difficulty?: number) {
    if (type >= SHIP_MODEL_COUNT) {
      return;
    }
    this._type = type as ShipModelType;
    this._difficulty = difficulty!;
    this._fuel = shipModelForType(type).fuelTanks;
    this._hull = this._hullStrength();
    this._upgradedHull = false;
    this._currentShieldPower = 0;
    this._cargoBuyingPrice = new Map();
    this._cargo = new Map();
    this._weapons = [];
    this._shields = [];
    this._gadgets = [];
    this._crew = [];
    this.tribbles = 0;
  }

  // A new ship of this model: full tanks, a whole hull, and nothing on board.
  static create(model: ShipModelType, difficulty: number): Ship {
    return new Ship(model, difficulty);
  }

  // A ship from a saved game, as parseSavedGame checked it. A crew member who is also a
  // system's mercenary is that same mercenary.
  static load(state: ShipState, solarSystems: SolarSystem[]): Ship {
    return Ship.fromSerializedState(state, solarSystems);
  }

  static bestShipWithDifficulty(difficulty: number) {
    ensureInteger(difficulty);

    const ship = new Ship(ShipModelType.Best, difficulty);

    while (ship.addShieldOfType(AccessoryType.ShieldLastBuyable)) {
      /* until every slot is full */
    }
    while (ship.addWeaponOfType(AccessoryType.WeaponLastBuyable)) {
      /* until every slot is full */
    }

    ship.addGadgetOfType(AccessoryType.GadgetTargetingSystem);
    ship.addGadgetOfType(AccessoryType.GadgetNavigationSystem);

    return ship;
  }

  static createFromPreviousShip(type: ShipModelType, previousShip: Ship) {
    const ship = new Ship(type, previousShip._difficulty);

    if (previousShip) {
      for (const accessory of previousShip._weapons) {
        if (!ship.addWeaponOfType(accessory.type)) {
          break;
        }
      }
      for (const accessory of previousShip._shields) {
        if (!ship.addShieldOfType(accessory.type)) {
          break;
        }
      }
      for (const accessory of previousShip._gadgets) {
        if (!ship.addGadgetOfType(accessory.type)) {
          break;
        }
      }
      for (let itemType = TRADE_ITEM_COUNT - 1; itemType >= 0; itemType--) {
        const quantity = previousShip.tradeItemQuantityForType(itemType);
        ensureInteger(quantity);
        if (quantity > 0) {
          if (
            ship.boughtQuantity(
              quantity,
              itemType,
              previousShip.tradeItemAverageBuyingPriceForType(itemType)
            ) <= 0
          ) {
            break;
          }
        }
      }
    }

    return ship;
  }

  static fromSerializedState(serializedState: ShipState, solarSystems: SolarSystem[]) {
    const ship = new Ship(SHIP_MODEL_COUNT);

    ship._upgradedHull = serializedState.upgradedHull;
    ship._type = serializedState.type as ShipModelType;
    ship._difficulty = serializedState.difficulty;
    ship._fuel = serializedState.fuel;
    ship._hull = serializedState.hull;
    ship.tribbles = serializedState.tribbles;

    ship._crew = [];
    if (serializedState.crewMap) {
      for (const crewName in serializedState.crewMap) {
        const mercenary = Ship.crewMemberForName(crewName, solarSystems);
        if (mercenary) {
          ship.addCrewMember(mercenary);
        } else {
          const crewMember = CrewMember.load(serializedState.crewMap[crewName]);
          ship.addCrewMember(crewMember);
        }
      }
    }

    ship._cargo = new Map();
    if (serializedState.cargoKeys && serializedState.cargoValues) {
      serializedState.cargoKeys.forEach((key, idx) => {
        ensureInteger(key);
        ensureInteger(idx);
        ship._cargo.set(key, serializedState.cargoValues[idx]);
      });
    }

    ship._cargoBuyingPrice = new Map();
    if (serializedState.cargoBuyingPriceKeys && serializedState.cargoBuyingPriceValues) {
      serializedState.cargoBuyingPriceKeys.forEach((key, idx) => {
        ensureInteger(key);
        ensureInteger(idx);
        ship._cargoBuyingPrice.set(key, serializedState.cargoBuyingPriceValues[idx]);
      });
    }

    ship._weapons = [];
    if (serializedState.weaponTypes) {
      serializedState.weaponTypes.forEach(accessoryType => {
        ensureInteger(accessoryType);
        ship.addAccessoryOfType(accessoryType as AccessoryType);
      });
    }

    ship._shields = [];
    if (serializedState.shieldTypes) {
      serializedState.shieldTypes.forEach(accessoryType => {
        ensureInteger(accessoryType);
        ship.addAccessoryOfType(accessoryType as AccessoryType);
      });
    }

    // Set this after adding shields to correct the current shield power
    ship._currentShieldPower = serializedState.currentShieldPower;

    ship._gadgets = [];
    if (serializedState.gadgetTypes) {
      serializedState.gadgetTypes.forEach(accessoryType => {
        ensureInteger(accessoryType);
        ship.addAccessoryOfType(accessoryType as AccessoryType);
      });
    }

    return ship;
  }

  // Accessors
  get type() {
    return this._type;
  }

  get gadgets() {
    return this._gadgets;
  }

  get weapons() {
    return this._weapons;
  }

  get shields() {
    return this._shields;
  }

  get gadgetSlots() {
    return shipModelForType(this._type).gadgetSlots;
  }

  get weaponSlots() {
    return shipModelForType(this._type).weaponSlots;
  }

  get shieldSlots() {
    return shipModelForType(this._type).shieldSlots;
  }

  // Static method to get crew member by name
  static crewMemberForName(name: string, solarSystems: SolarSystem[]) {
    if (!name) return null;

    return solarSystems.find(system => system.mercenary?.name === name)?.mercenary ?? null;
  }

  get crew() {
    return this._crew;
  }

  // Method to add a crew member
  addCrewMember(crew: CrewMember) {
    if (this._crew.length >= shipModelForType(this._type).mercenaryQuarters()) {
      return false;
    }

    if (ensureType(crew, 'object')) {
      pLog.log(44);
      this._crew.push(crew);
      return true;
    }

    return false;
  }

  // Method to remove a crew member
  removeCrewMember(crew: CrewMember) {
    if (crew) {
      const index = this._crew.indexOf(crew);
      if (index > -1) {
        pLog.log(45);
        this._crew.splice(index, 1);
      }
    }
  }

  // Method to remove a crew member by name
  removeCrewMemberWithName(name: string) {
    const toRemove = this._crew.findLast(crewMember => crewMember.name === name);

    if (toRemove) {
      pLog.log(46);
      this.removeCrewMember(toRemove);
    }
  }

  // Method to get the count of crew members
  crewCount() {
    if (this._crew !== null && ensureArrayOrNull(this._crew, 'object')) {
      return this._crew.length;
    }

    return 0;
  }

  // Method to remove all crew members
  removeAllCrewMembers() {
    this._crew = [];
  }

  get hull() {
    return this._hull;
  }

  // Method to get the maximum hull strength
  maximumHullStrength() {
    return this._hullStrength();
  }

  // Private method to calculate hull strength
  _hullStrength() {
    const baseStrength = shipModelForType(this._type).hullStrength;
    const result = baseStrength + (this._upgradedHull ? 50 : 0);
    ensureInteger(result);
    return result;
  }

  get upgradedHull() {
    return this._upgradedHull;
  }

  // Method to set upgraded hull
  setUpgradedHull(upgradedHull: boolean) {
    if (!ensureBool(upgradedHull)) {
      return;
    }

    if (upgradedHull !== this._upgradedHull) {
      this._upgradedHull = upgradedHull;
      this._hull += this._upgradedHull ? 50 : 0;
    }
  }

  // Method to calculate weapon power within a range
  weaponPowerBetweenMinMaxInclusive(min: number, max: number) {
    const power = this._weapons
      .filter(weapon => weapon.type >= min && weapon.type <= max)
      .reduce((sum, weapon) => sum + weapon.power, 0);

    ensureInteger(power);
    return power;
  }

  // Method to check if ship has a weapon of a specific type
  hasWeaponOfType(type: AccessoryType) {
    return this.weaponPowerBetweenMinMaxInclusive(type, type) > 0;
  }

  // Method to check if ship has a gadget of a specific type
  hasGadgetOfType(accessoryType: AccessoryType) {
    return this.countGadgetOfType(accessoryType, true) > 0;
  }

  // Method to count gadgets of a specific type
  countGadgetOfType(gadgetType: AccessoryType, limitOne: boolean) {
    const count = this._gadgets.filter(gadget => gadget.type === gadgetType).length;
    return limitOne ? Math.min(count, 1) : count;
  }

  // Method to check if the ship has a shield of a specific type
  hasShieldOfType(type: AccessoryType) {
    return this._shields && this._shields.includes(shieldForType(type)!);
  }

  // Method to check if the ship has any shields
  hasAnyShield() {
    ensureType(this._shields, 'object');
    return this._shields.length !== 0;
  }

  // Method to calculate free slots for an accessory type
  freeSlotsForAccessoryType(type: AccessoryType) {
    let totalSlots = 0;
    let accessories: Accessory[] = [];

    if (shieldForType(type)) {
      totalSlots = shipModelForType(this._type).shieldSlots;
      accessories = this._shields;
    } else if (gadgetForType(type)) {
      totalSlots = shipModelForType(this._type).gadgetSlots;
      accessories = this._gadgets;
    } else if (weaponForType(type)) {
      totalSlots = shipModelForType(this._type).weaponSlots;
      accessories = this._weapons;
    }

    ensureInteger(totalSlots);
    ensureInteger(accessories.length);

    return Math.max(0, totalSlots - accessories.length);
  }

  // Method to add an accessory of a specific type
  addAccessoryOfType(type: AccessoryType) {
    return this.addGadgetOfType(type) || this.addShieldOfType(type) || this.addWeaponOfType(type);
  }

  // Private method to remove an accessory type from a list
  _removeType(type: AccessoryType, list: Accessory[] | null) {
    if (!list) {
      return false;
    }

    const index = list.indexOf(accessoryForType(type)!);
    if (index !== -1) {
      list.splice(index, 1);
      return true;
    }
    return false;
  }

  // Method to remove an accessory of a specific type
  removeAccessoryOfType(type: AccessoryType) {
    if (this._removeType(type, this._gadgets) || this._removeType(type, this._weapons)) return true;
    if (!this._removeType(type, this._shields)) return false;
    // A shield takes its charge with it: the rest cannot hold more than their own power.
    const most = this._shields.reduce((sum, shield) => sum + shield.power, 0);
    this._currentShieldPower = Math.min(this._currentShieldPower, most);
    return true;
  }

  // Method to add a shield of a specific type
  addShieldOfType(type: AccessoryType) {
    const shield = shieldForType(type);

    if (!shield || this._shields.length >= shipModelForType(this._type).shieldSlots) {
      return false;
    }

    this._shields.push(shield);
    this._currentShieldPower += shield.power;

    return true;
  }

  // Method to add a weapon of a specific type
  addWeaponOfType(type: AccessoryType) {
    const weapon = weaponForType(type);

    if (!weapon || this._weapons.length >= shipModelForType(this._type).weaponSlots) {
      return false;
    }

    this._weapons.push(weapon);

    return true;
  }

  // Method to add a gadget of a specific type
  addGadgetOfType(type: AccessoryType) {
    const gadget = gadgetForType(type);

    if (!gadget || this._gadgets.length >= shipModelForType(this._type).gadgetSlots) {
      return false;
    }

    this._gadgets.push(gadget);

    return true;
  }

  fuelTankCapacity() {
    return this.hasGadgetOfType(AccessoryType.GadgetFuelCompactor)
      ? 18
      : shipModelForType(this._type).fuelTanks;
  }

  get currentShieldPower() {
    return this._currentShieldPower;
  }

  get fuel() {
    return Math.min(this._fuel, this.fuelTankCapacity());
  }

  consumeFuelOverDistance(distance: number) {
    if (ensureInteger(distance)) {
      this._fuel -= Math.min(distance, this._fuel);
    }
  }

  refillFuelTanks() {
    this._fuel = this.fuelTankCapacity();
  }

  // Float between [0, 1] for display in UI
  hullPercentage() {
    const r = this._hull / this._hullStrength();
    return r;
  }

  // Float between [0, 1] for display in UI
  shieldPercentage() {
    const currentShield = this._currentShieldPower;
    this.rechargeShieldPower();
    const fullShield = this._currentShieldPower;
    this._currentShieldPower = currentShield;

    return currentShield / fullShield;
  }

  rechargeShieldPower() {
    this._currentShieldPower = this._shields.reduce((sum, shield) => sum + shield.power, 0);
  }

  rechargeShieldPowerByAmount(amount: number) {
    if (amount <= 0) {
      return;
    }
    if (!ensureInteger(amount)) {
      return;
    }

    const allowedRechargedShieldPower = this._currentShieldPower + amount;
    this.rechargeShieldPower(); // fully recharge
    this._currentShieldPower = Math.min(this._currentShieldPower, allowedRechargedShieldPower);
  }

  // Returns the damage the shields could not take.
  damageShieldsByAmount(amount: number) {
    if (!ensureInteger(amount)) {
      return 0;
    }

    if (amount <= 0) return 0;

    this._currentShieldPower -= amount;
    const damageRemaining = -1 * Math.min(this._currentShieldPower, 0);
    this._currentShieldPower = Math.max(this._currentShieldPower, 0);

    return damageRemaining;
  }

  fillFuelByAmount(amount: number) {
    if (!ensureInteger(amount)) {
      return;
    }

    this._fuel = Math.min(this._fuel + amount, this.fuelTankCapacity());
  }

  // Returns the part of `amount` that was not needed.
  repairHullByAmount(amount: number) {
    if (!ensureInteger(amount)) {
      return 0;
    }

    const previousHullStrength = this._hull;

    const fullHullStrength = this._hullStrength();
    const allowedHullStrength = this._hull + amount;
    this._hull = Math.min(fullHullStrength, allowedHullStrength);

    const consumedRepairs = this._hull - previousHullStrength;

    return amount - consumedRepairs;
  }

  damageHullByAmount(amount: number) {
    if (!ensureInteger(amount)) {
      return;
    }

    if (amount <= 0) return;

    this._hull -= amount;
    this._hull = Math.max(this._hull, 0);
  }

  shipOwnedByCommanderIsCloakedToOpponent(commander: CrewMember, opponent: ShipOwner) {
    return (
      this.hasGadgetOfType(AccessoryType.GadgetCloakingDevice) &&
      this.crewEngineerSkillIncludingCommander(commander) >
        opponent.ship.crewEngineerSkillIncludingCommander(opponent)
    );
  }

  shipValuationForInsurance(insurance: boolean) {
    let value = 0;
    const model = shipModelForType(this._type);
    const resalePrice = (x: number) => Math.floor((x * 3) / 4);

    value +=
      this.tribbles > 0 && !insurance ? Math.floor(model.price / 4) : resalePrice(model.price);

    value -= (this._hullStrength() - this._hull) * model.repairCosts;
    value -= (model.fuelTanks - this._fuel) * model.costOfFuel;

    value += [...this._weapons, ...this._shields, ...this._gadgets].reduce(
      (sum, accessory) => sum + resalePrice(accessory.price),
      0
    );

    ensureInteger(value);

    return Math.floor(value);
  }

  _enemyShipValuationWithOpponent(opponent: CrewMember) {
    // Don't include gadgets since they influnce the skill-based valuation
    let value = [...this._weapons, ...this._shields].reduce(
      (sum, accessory) => sum + accessory.price,
      shipModelForType(this._type).price
    );
    value =
      (value *
        (2 * this.crewPilotSkillIncludingCommander(opponent) +
          this.crewEngineerSkillIncludingCommander(opponent) +
          3 * this.crewFighterSkillIncludingCommander(opponent))) /
      60;

    value = Math.floor(value);

    ensureInteger(value);

    return value;
  }

  bountyForEnemyShipWithOpponent(opponent: CrewMember) {
    let value = this._enemyShipValuationWithOpponent(opponent);
    value /= 200;
    value /= 25;
    value = Math.floor(value);
    value *= 25;
    return Math.min(Math.max(value, 25), 2500);
  }

  crewEngineerSkillIncludingCommander(commander: CrewMember) {
    let maxSkill = Math.max(
      commander.engineer,
      ...this._crew.map(crewMember => crewMember.engineer)
    );

    if (this.hasGadgetOfType(AccessoryType.GadgetAutoRepairSystem)) {
      maxSkill += SKILL_BONUS;
    }

    ensureInteger(maxSkill);

    return adjustSkillForDifficulty(maxSkill, this._difficulty);
  }

  crewTraderSkillIncludingCommander(commander: CrewMember) {
    let maxSkill = Math.max(commander.trader, ...this._crew.map(crewMember => crewMember.trader));

    if (commander.carriesMaxTraderBoost) {
      maxSkill++;
    }

    ensureInteger(maxSkill);

    return adjustSkillForDifficulty(maxSkill, this._difficulty);
  }

  crewFighterSkillIncludingCommander(commander: CrewMember) {
    let maxSkill = Math.max(commander.fighter, ...this._crew.map(crewMember => crewMember.fighter));

    if (this.hasGadgetOfType(AccessoryType.GadgetTargetingSystem)) {
      maxSkill += SKILL_BONUS;
    }

    ensureInteger(maxSkill);

    return adjustSkillForDifficulty(maxSkill, this._difficulty);
  }

  crewPilotSkillIncludingCommander(commander: CrewMember) {
    let maxSkill = Math.max(commander.pilot, ...this._crew.map(crewMember => crewMember.pilot));

    if (this.hasGadgetOfType(AccessoryType.GadgetNavigationSystem)) {
      maxSkill += SKILL_BONUS;
    }

    if (this.hasGadgetOfType(AccessoryType.GadgetCloakingDevice)) {
      maxSkill += CLOAK_BONUS;
    }

    ensureInteger(maxSkill);

    return adjustSkillForDifficulty(maxSkill, this._difficulty);
  }

  tradeItemQuantityForType(type: number) {
    return this._cargo.get(type) || 0;
  }

  tradeItemAverageBuyingPriceForType(type: number) {
    const numItems = this.tradeItemQuantityForType(type);

    if (numItems === 0) {
      return 0;
    }

    return Math.floor((this._cargoBuyingPrice.get(type) || 0) / numItems);
  }

  boughtQuantity(quantity: number, itemType: number, price: number) {
    if (!ensureArrayOrNull([quantity, itemType, price], 'number')) {
      return 0;
    }

    const freeCargoBays = this.freeCargoBays();
    quantity = Math.min(quantity, freeCargoBays);

    const currentQuantity = this._cargo.get(itemType) || 0;
    this._cargo.set(itemType, currentQuantity + quantity);

    const currentPrice = this._cargoBuyingPrice.get(itemType) || 0;
    this._cargoBuyingPrice.set(itemType, currentPrice + price * quantity);

    return quantity;
  }

  soldQuantity(quantity: number, itemType: number) {
    if (!ensureArrayOrNull([quantity, itemType], 'number')) {
      return;
    }

    const oldQuantity = this.tradeItemQuantityForType(itemType);
    if (quantity === 0 || (oldQuantity === 0 && quantity > 0)) {
      return;
    }

    const newQuantity = oldQuantity - Math.min(oldQuantity, quantity);
    this._cargo.set(itemType, newQuantity);

    const oldBuyingPrice = this._cargoBuyingPrice.get(itemType) || 0;
    const newBuyingPrice = Math.floor((oldBuyingPrice * newQuantity) / oldQuantity);
    this._cargoBuyingPrice.set(itemType, newBuyingPrice);
  }

  _tradeableItemsForSystem(
    solarSystem: SolarSystem | null,
    onlyIllegal: boolean,
    onlyLegalOrIllegal: boolean,
    limit: number
  ) {
    const ret = [];

    for (const [tradeItem, quantity] of this._cargo) {
      if (quantity <= 0) {
        continue;
      }

      if (tradeItem >= FAKE_QUEST_CARGO_START) {
        continue;
      }

      if (onlyIllegal !== isIllegalTradeItem(tradeItem) && onlyLegalOrIllegal) {
        continue;
      }

      if (!solarSystem || solarSystem.standardPriceForItem(tradeItem) > 0) {
        ret.push(tradeItem);
        if (ret.length >= limit) {
          break;
        }
      }
    }

    return ret;
  }

  hasTradeableItemsForSystem(solarSystem: SolarSystem | null, onlyIllegal: boolean) {
    return this._tradeableItemsForSystem(solarSystem, onlyIllegal, true, 1).length > 0;
  }

  randomTradeableItemForSystem(solarSystem: SolarSystem | null, onlyIllegal: boolean) {
    const items = this._tradeableItemsForSystem(solarSystem, onlyIllegal, true, this._cargo.size);
    if (items.length <= 0) {
      return NO_TRADE_ITEM;
    }

    const randomIndex = runtime.gameRand.randomIntBelow(items.length);
    return items[randomIndex];
  }

  randomTradeableItem() {
    const items = this._tradeableItemsForSystem(null, false, false, this._cargo.size);
    if (items.length <= 0) {
      return NO_TRADE_ITEM;
    }

    const randomIndex = runtime.gameRand.randomIntBelow(items.length);
    return items[randomIndex];
  }

  totalCargoBays() {
    const extraCount = this.countGadgetOfType(AccessoryType.GadgetFiveExtraCargoBays, false);
    const result = shipModelForType(this._type).cargoBays + 5 * extraCount;
    ensureInteger(result);
    return result;
  }

  freeCargoBays() {
    const totalBays = this.totalCargoBays();
    const loaded = [...this._cargo.values()].reduce((sum, quantity) => sum + quantity, 0);
    const consumedBays = Math.min(loaded, totalBays);
    const result = totalBays - consumedBays;
    ensureInteger(result);
    return result;
  }

  mercenaryPricePerDay() {
    return this._crew.reduce((price, crew) => price + crew.hirePrice(), 0);
  }

  costOfFuel() {
    return shipModelForType(this._type).costOfFuel;
  }

  get model() {
    return shipModelForType(this._type);
  }

  hasIllegalGoods() {
    return (
      this.tradeItemQuantityForType(TradeItemType.Firearms) > 0 ||
      this.tradeItemQuantityForType(TradeItemType.Narcotics) > 0 ||
      this.tradeItemQuantityForType(FAKE_QUEST_CARGO_REACTOR) > 0
    );
  }

  toState() {
    // Filled in field by field below.
    const state = {} as ShipState;

    // BOOL
    ensureBool(this._upgradedHull);
    state.upgradedHull = this._upgradedHull;

    // char
    ensureInteger(this._type);
    state.type = this._type;

    ensureInteger(this._difficulty);
    state.difficulty = this._difficulty;

    ensureInteger(this._fuel);
    state.fuel = this._fuel;

    // NSInteger
    ensureInteger(this._hull);
    state.hull = this._hull;

    ensureInteger(this.tribbles);
    state.tribbles = this.tribbles;

    ensureInteger(this._currentShieldPower);
    state.currentShieldPower = this._currentShieldPower;

    // NSDictionary
    ensureMapOrNull(this._cargo);
    if (this._cargo) {
      state.cargoKeys = [];
      state.cargoValues = [];

      for (const [key, value] of this._cargo) {
        ensureInteger(key);
        state.cargoKeys.push(key);

        ensureInteger(value);
        state.cargoValues.push(value);
      }
    }

    ensureMapOrNull(this._cargoBuyingPrice);
    if (this._cargoBuyingPrice) {
      state.cargoBuyingPriceKeys = [];
      state.cargoBuyingPriceValues = [];

      for (const [key, value] of this._cargoBuyingPrice) {
        ensureInteger(key);
        state.cargoBuyingPriceKeys.push(key);

        ensureInteger(value);
        state.cargoBuyingPriceValues.push(value);
      }
    }

    // NSArray
    ensureArrayOrNull(this._weapons, 'object');
    if (this._weapons.length) {
      state.weaponTypes = this._weapons.map(weapon => weapon.type);
      ensureArrayOrNull(state.weaponTypes, 'number');
    }

    ensureArrayOrNull(this._shields, 'object');
    if (this._shields.length) {
      state.shieldTypes = this._shields.map(shield => shield.type);
      ensureArrayOrNull(state.shieldTypes, 'number');
    }

    ensureArrayOrNull(this._gadgets, 'object');
    if (this._gadgets.length) {
      state.gadgetTypes = this._gadgets.map(gadget => gadget.type);
      ensureArrayOrNull(state.gadgetTypes, 'number');
    }

    ensureArrayOrNull(this._crew, 'object');
    if (this._crew.length) {
      state.crewMap = {};
      this._crew.forEach(crewMember => {
        ensureType(crewMember.name, 'string');
        state.crewMap![crewMember.name!] = crewMember.toState();
      });
    }

    return state;
  }
}
