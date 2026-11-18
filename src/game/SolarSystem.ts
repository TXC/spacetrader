import { CrewMember } from './CrewMember.ts';
import { occurrenceStr, politicsForType, randomPoliticsForTechLevel } from './Politics.ts';
import type { Politics } from './Politics.ts';
import {
  SpecialEvent,
  SystemSize,
  systemSizeName,
  SYSTEM_SIZE_COUNT,
} from './SolarSystem.types.ts';
import { tradeItemForType } from './TradeItem.ts';
import {
  resourceName,
  Resource,
  Status,
  TechLevel,
  TradeItemType,
  statusDescription,
  techLevelName,
  RESOURCE_COUNT,
  STATUS_COUNT,
  TECH_LEVEL_COUNT,
  TRADE_ITEM_COUNT,
} from './TradeItem.types.ts';
import {
  ensureArrayOrNull,
  ensureBool,
  ensureInteger,
  ensureObjectOrNull,
  ensureType,
} from './ensure.ts';
import { runtime } from './runtime.ts';

import type { SolarSystemState } from './savedGame.ts';
export type { SolarSystemState };

export class SolarSystem {
  declare static sSystemNames: string[] | undefined;
  declare _name: string;
  declare _x: number;
  declare _y: number;
  declare _difficulty: number;
  declare _mercenary: CrewMember | null;
  declare _wormhole: SolarSystem | null;
  declare _specialEvent: SpecialEvent;
  declare _visited: boolean;
  declare _techLevel: TechLevel;
  declare _politics: Politics;
  declare _specialResource: Resource;
  declare _size: SystemSize;
  declare _status: Status;
  declare _inventoryReplenishCountdown: number;
  declare _tradeItemInventory: number[];

  constructor(name?: string, x?: number, y?: number, difficulty?: number) {
    if (!name) {
      return;
    }

    ensureType(name, 'string');
    this._name = name;

    ensureArrayOrNull([x, y, difficulty], 'number');
    this._x = x!;
    this._y = y!;
    this._difficulty = difficulty!;

    this._mercenary = null;
    this._wormhole = null;

    this._specialEvent = SpecialEvent.None;
    this._visited = false;

    // Randomize the other properties
    this._techLevel = runtime.gameRand.randomIntBelow(TECH_LEVEL_COUNT) as TechLevel;
    this._politics = randomPoliticsForTechLevel(this._techLevel);

    if (runtime.gameRand.randomIntBelow(5) >= 3) {
      this._specialResource = (1 + runtime.gameRand.randomIntBelow(RESOURCE_COUNT - 1)) as Resource;
    } else {
      this._specialResource = Resource.None;
    }

    this._size = runtime.gameRand.randomIntBelow(SYSTEM_SIZE_COUNT) as SystemSize;

    this._status = Status.Uneventful;
    this.randomizeStatus();

    this._inventoryReplenishCountdown = 0;
    this._initializeInventories();
  }

  static solarSystemNames() {
    if (!this.sSystemNames) {
      this.sSystemNames = [
        'Acamar',
        'Adahn',
        'Aldea',
        'Andevian',
        'Antedi',
        'Ashen',
        'Balosnee',
        'Baratas',
        'Brax',
        'Bretel',
        'Calondia',
        'Campor',
        'Capelle',
        'Carzon',
        'Castor',
        'Cestus',
        'Cheron',
        'Courteney',
        'Daled',
        'Damast',
        'Davlos',
        'Deneb',
        'Deneva',
        'Devidia',
        'Draylon',
        'Drema',
        'Endor',
        'Esmee',
        'Exo',
        'Ferris',
        'Festen',
        'Fourmi',
        'Frolix',
        'Gemulon',
        'Guinifer',
        'Hades',
        'Hamlet',
        'Helena',
        'Hulst',
        'Iodine',
        'Iralius',
        'Janus',
        'Japori',
        'Jarada',
        'Jason',
        'Kaylon',
        'Khefka',
        'Kira',
        'Klaatu',
        'Klaestron',
        'Korma',
        'Kravat',
        'Krios',
        'Laertes',
        'Largo',
        'Lave',
        'Leda',
        'Ligon',
        'Lowry',
        'Magrat',
        'Malcoria',
        'Melina',
        'Mentar',
        'Merik',
        'Mintaka',
        'Montor',
        'Mordan',
        'Nelvana',
        'Nix',
        'Nyle',
        'Odet',
        'Og',
        'Omega',
        'Omphalos',
        'Orias',
        'Othello',
        'Parade',
        'Penthara',
        'Picard',
        'Pollux',
        'Quator',
        'Rakhar',
        'Ran',
        'Regulas',
        'Relva',
        'Rhymus',
        'Rochani',
        'Rubicum',
        'Rutia',
        'Sarpeidon',
        'Sefalla',
        'Seltrice',
        'Sigma',
        'Sol',
        'Somari',
        'Stakoron',
        'Styris',
        'Talani',
        'Tamus',
        'Tantalos',
        'Tanuga',
        'Tarchannen',
        'Terosa',
        'Thera',
        'Titan',
        'Torin',
        'Triacus',
        'Turkana',
        'Tyrus',
        'Umberlee',
        'Utopia',
        'Vadera',
        'Vagra',
        'Vandor',
        'Ventax',
        'Xenon',
        'Xerxes',
        'Yew',
        'Yojimbo',
        'Zalkon',
        'Zuul',
      ];
    }
    return this.sSystemNames;
  }

  static indexForSystemName(name: string) {
    return SolarSystem.solarSystemNames().indexOf(name);
  }

  static solarSystemForName(name: string | null | undefined, solarSystems: SolarSystem[]) {
    ensureArrayOrNull(solarSystems, 'object');

    if (!name) return null;

    return solarSystems.find(solarSystem => solarSystem._name === name) ?? null;
  }

  // A new system, with its tech level, government, resources, size, status and
  // inventories drawn at random.
  static create(name: string, x: number, y: number, difficulty: number): SolarSystem {
    return new SolarSystem(name, x, y, difficulty);
  }

  // A system from a saved game, as parseSavedGame checked it. Its wormhole is linked once
  // every system is loaded.
  static load(state: SolarSystemState): SolarSystem {
    return SolarSystem.fromSerializedState(state);
  }

  static fromSerializedState(serializedState: SolarSystemState) {
    const solarSystem = new SolarSystem();
    solarSystem._name = serializedState.name;
    solarSystem._techLevel = serializedState.techLevel as TechLevel;
    solarSystem._status = serializedState.status as Status;
    solarSystem._specialResource = serializedState.specialResource as Resource;
    solarSystem._size = serializedState.size as SystemSize;
    solarSystem._specialEvent = serializedState.specialEvent as SpecialEvent;
    solarSystem._difficulty = serializedState.difficulty;
    solarSystem._politics = politicsForType(serializedState.politicsType);

    solarSystem._x = serializedState.x;
    solarSystem._y = serializedState.y;

    solarSystem._inventoryReplenishCountdown = serializedState.inventoryReplenishCountdown;

    solarSystem._visited = serializedState.visited;

    const mercenaryState = serializedState.mercenary;
    if (mercenaryState) {
      solarSystem._mercenary = CrewMember.load(mercenaryState);
      ensureObjectOrNull(solarSystem._mercenary);
    } else {
      solarSystem._mercenary = null;
    }

    const tradeItemInventoryArray = serializedState.tradeItemInventory;
    solarSystem._tradeItemInventory = Array<number>(TRADE_ITEM_COUNT).fill(0);
    for (let tradeItemType = 0; tradeItemType < TRADE_ITEM_COUNT; ++tradeItemType) {
      solarSystem._tradeItemInventory[tradeItemType] = tradeItemInventoryArray[tradeItemType];
    }

    return solarSystem;
  }

  updateWormholeForSerializedState(serializedState: SolarSystemState, solarSystems: SolarSystem[]) {
    const wormholeName = serializedState.wormholeName;
    this._wormhole = SolarSystem.solarSystemForName(wormholeName, solarSystems);
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  get size() {
    return this._size;
  }

  getName() {
    return this._name;
  }

  get name() {
    return this._name;
  }

  get techLevel() {
    return this._techLevel;
  }

  set techLevel(t: TechLevel) {
    if (ensureInteger(t)) {
      this._techLevel = t;
    }
  }

  setVisited(v: boolean) {
    if (ensureBool(v)) {
      this._visited = v;
    }
  }

  get visited() {
    return this._visited;
  }

  set visited(v: boolean) {
    this.setVisited(v);
  }

  get inventoryReplenishCountdown() {
    return this._inventoryReplenishCountdown;
  }

  set inventoryReplenishCountdown(i: number) {
    if (ensureInteger(i)) {
      this._inventoryReplenishCountdown = i;
    }
  }

  setWormhole(sys: SolarSystem) {
    if (ensureType(sys, 'object')) {
      this._wormhole = sys;
    }
  }

  get wormhole() {
    return this._wormhole;
  }

  getStatus() {
    return this._status;
  }

  get status() {
    return this._status;
  }

  setSpecialEvent(sE: SpecialEvent) {
    if (ensureInteger(sE)) {
      this._specialEvent = sE;
    }
  }

  getSpecialEvent() {
    return this._specialEvent;
  }

  get specialEvent() {
    return this._specialEvent;
  }

  set specialEvent(sE: SpecialEvent) {
    this.setSpecialEvent(sE);
  }

  setMercenary(m: CrewMember) {
    if (ensureType(m, 'object')) {
      this._mercenary = m;
    }
  }

  getMercenary() {
    return this._mercenary;
  }

  get mercenary() {
    return this._mercenary;
  }

  getPolitics() {
    return this._politics;
  }

  get politics() {
    return this._politics;
  }

  set politics(p: Politics) {
    if (ensureInteger(p.type)) {
      this._politics = p;
    }
  }

  hashCode() {
    const str = this._name;

    let hash = 0,
      i,
      chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
      hash = Math.abs(hash);
    }
    return hash;
  }

  _initializeInventories() {
    this._tradeItemInventory = Array<number>(TRADE_ITEM_COUNT).fill(0);
    for (let itemType = 0; itemType < TRADE_ITEM_COUNT; ++itemType) {
      const item = tradeItemForType(itemType);

      if (!this._canProduceItem(itemType)) {
        this._tradeItemInventory[itemType] = 0;
        continue;
      }

      this._tradeItemInventory[itemType] =
        (9 +
          runtime.gameRand.randomIntBelow(5) -
          Math.abs(item.techLevelMaxProd - this._techLevel)) *
        (1 + this._size);

      if (itemType === TradeItemType.Robots || itemType === TradeItemType.Narcotics) {
        this._tradeItemInventory[itemType] =
          Math.floor(
            (this._tradeItemInventory[itemType] * (5 - this._difficulty)) / (6 - this._difficulty)
          ) + 1;
      }

      if (item.cheapResource !== Resource.None) {
        if (this._specialResource === item.cheapResource) {
          this._tradeItemInventory[itemType] = Math.floor(
            (this._tradeItemInventory[itemType] * 4) / 3
          );
        }
      }

      if (item.expensiveResource !== Resource.None) {
        if (this._specialResource === item.expensiveResource) {
          this._tradeItemInventory[itemType] = Math.floor(
            (this._tradeItemInventory[itemType] * 3) / 4
          );
        }
      }

      if (item.doublePriceStatus !== Status.Uneventful) {
        if (this._status === item.doublePriceStatus) {
          this._tradeItemInventory[itemType] = Math.floor(this._tradeItemInventory[itemType] / 5);
        }
      }

      this._tradeItemInventory[itemType] =
        this._tradeItemInventory[itemType] -
        runtime.gameRand.randomIntBelow(10) +
        runtime.gameRand.randomIntBelow(10);
      this._tradeItemInventory[itemType] = Math.max(this._tradeItemInventory[itemType], 0);

      ensureInteger(this._tradeItemInventory[itemType]);
    }
  }

  distanceTo(other: SolarSystem) {
    return Math.floor(Math.sqrt(this.squaredDistanceTo(other)));
  }

  squaredDistanceTo(other: SolarSystem) {
    return Math.floor(this.squaredDistanceToXY(other._x, other._y));
  }

  squaredDistanceToXY(x: number, y: number) {
    ensureInteger(x);
    ensureInteger(y);
    return Math.floor((this._x - x) ** 2 + (this._y - y) ** 2);
  }

  standardPriceForItem(itemType: number) {
    if (
      (itemType === TradeItemType.Narcotics && !this._politics.drugsTradeable) ||
      (itemType === TradeItemType.Firearms && !this._politics.firearmsTradeable)
    ) {
      return 0;
    }

    const item = tradeItemForType(itemType);

    if (this._techLevel < item.techLevelToUse) {
      return 0;
    }

    let price = item.priceLowTech + Math.floor(this._techLevel * item.priceIncreasePerTechLevel);

    if (this._politics.mostDesiredTradeItem === itemType) {
      price = Math.floor((price * 4) / 3);
    }

    price = Math.floor((price * (100 - 2 * this._politics.occurrenceTraders)) / 100);
    price = Math.floor((price * (100 - this._size)) / 100);

    if (this._visited && this._specialResource !== Resource.None) {
      if (item.cheapResource === this._specialResource) {
        price = Math.floor((price * 3) / 4);
      }

      if (item.expensiveResource === this._specialResource) {
        price = Math.floor((price * 4) / 3);
      }
    }

    ensureInteger(price);

    return Math.max(price, 0);
  }

  tradeItemQuantityForType(type: number) {
    ensureInteger(type);
    return this._tradeItemInventory[type];
  }

  boughtQuantity(quantity: number, type: number) {
    if (ensureInteger(quantity) && ensureInteger(type)) {
      this._tradeItemInventory[type] -= Math.min(quantity, this._tradeItemInventory[type]);
    }
  }

  _canProduceItem(itemType: number) {
    const item = tradeItemForType(itemType);

    const cantProduceItem =
      (itemType === TradeItemType.Narcotics && !this._politics.drugsTradeable) ||
      (itemType === TradeItemType.Firearms && !this._politics.firearmsTradeable) ||
      this._techLevel < item.techLevelToProduce;

    return !cantProduceItem;
  }

  updateInventories() {
    if (this._inventoryReplenishCountdown > 0) {
      this._inventoryReplenishCountdown--;

      if (this._inventoryReplenishCountdown <= 0) {
        this._initializeInventories();
      } else {
        for (let itemType = 0; itemType < TRADE_ITEM_COUNT; ++itemType) {
          if (!this._canProduceItem(itemType)) {
            this._tradeItemInventory[itemType] = 0;
            continue;
          }

          this._tradeItemInventory[itemType] = Math.max(
            0,
            this._tradeItemInventory[itemType] +
              runtime.gameRand.randomIntBelow(5) -
              runtime.gameRand.randomIntBelow(5)
          );
        }
      }
    } else {
      for (let itemType = 0; itemType < TRADE_ITEM_COUNT; ++itemType) {
        if (!this._canProduceItem(itemType)) {
          this._tradeItemInventory[itemType] = 0;
          continue;
        }
      }
    }
  }

  randomizeStatus() {
    const hasStatus = this._status !== Status.Uneventful;

    if (runtime.gameRand.randomIntBelow(100) < 15) {
      this._status = hasStatus
        ? Status.Uneventful
        : ((1 + runtime.gameRand.randomIntBelow(STATUS_COUNT - 1)) as Status);
    }
  }

  systemInfoString() {
    const systemInfo = `${systemSizeName(this.size).toLowerCase()} ${techLevelName(this.techLevel).toLowerCase()} ${this.politics.name.toLowerCase()}\n${statusDescription(this.status).toLowerCase()}\n${resourceName(this._specialResource).toLowerCase()}, ${occurrenceStr(this.politics.occurrencePolice).toLowerCase()} police, ${occurrenceStr(this.politics.occurrencePirates).toLowerCase()} pirates`;
    return systemInfo;
  }

  toState() {
    // Filled in field by field below.
    const state = {} as SolarSystemState;

    ensureType(this._name, 'string');
    state.name = this._name;

    ensureInteger(this._techLevel);
    state.techLevel = this._techLevel;

    ensureInteger(this._status);
    state.status = this._status;

    ensureInteger(this._specialResource);
    state.specialResource = this._specialResource;

    ensureInteger(this._size);
    state.size = this._size;

    ensureInteger(this._specialEvent);
    state.specialEvent = this._specialEvent;

    ensureInteger(this._difficulty);
    state.difficulty = this._difficulty;

    ensureInteger(this._politics.type);
    state.politicsType = this._politics.type;

    ensureInteger(this._x);
    state.x = this._x;
    ensureInteger(this._y);
    state.y = this._y;

    ensureInteger(this._inventoryReplenishCountdown);
    state.inventoryReplenishCountdown = this._inventoryReplenishCountdown;

    ensureBool(this._visited);
    state.visited = this._visited;

    ensureObjectOrNull(this._wormhole);
    if (this._wormhole) {
      ensureType(this._wormhole.name, 'string');
      state.wormholeName = this._wormhole.name;
    }

    ensureObjectOrNull(this._mercenary);
    if (this._mercenary) {
      state.mercenary = this._mercenary.toState();
    }

    ensureArrayOrNull(this._tradeItemInventory, 'number');
    state.tradeItemInventory = this._tradeItemInventory.map(item => item);

    return state;
  }
}
