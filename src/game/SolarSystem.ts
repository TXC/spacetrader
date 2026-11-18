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
  declare name: string;
  declare x: number;
  declare y: number;
  declare _difficulty: number;
  declare mercenary: CrewMember | null;
  declare wormhole: SolarSystem | null;
  declare specialEvent: SpecialEvent;
  declare visited: boolean;
  declare techLevel: TechLevel;
  declare politics: Politics;
  declare _specialResource: Resource;
  declare size: SystemSize;
  declare status: Status;
  declare _inventoryReplenishCountdown: number;
  declare _tradeItemInventory: number[];

  constructor(name?: string, x?: number, y?: number, difficulty?: number) {
    if (!name) {
      return;
    }

    ensureType(name, 'string');
    this.name = name;

    ensureArrayOrNull([x, y, difficulty], 'number');
    this.x = x!;
    this.y = y!;
    this._difficulty = difficulty!;

    this.mercenary = null;
    this.wormhole = null;

    this.specialEvent = SpecialEvent.None;
    this.visited = false;

    // Randomize the other properties
    this.techLevel = runtime.gameRand.randomIntBelow(TECH_LEVEL_COUNT) as TechLevel;
    this.politics = randomPoliticsForTechLevel(this.techLevel);

    if (runtime.gameRand.randomIntBelow(5) >= 3) {
      this._specialResource = (1 + runtime.gameRand.randomIntBelow(RESOURCE_COUNT - 1)) as Resource;
    } else {
      this._specialResource = Resource.None;
    }

    this.size = runtime.gameRand.randomIntBelow(SYSTEM_SIZE_COUNT) as SystemSize;

    this.status = Status.Uneventful;
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

    return solarSystems.find(solarSystem => solarSystem.name === name) ?? null;
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
    solarSystem.name = serializedState.name;
    solarSystem.techLevel = serializedState.techLevel as TechLevel;
    solarSystem.status = serializedState.status as Status;
    solarSystem._specialResource = serializedState.specialResource as Resource;
    solarSystem.size = serializedState.size as SystemSize;
    solarSystem.specialEvent = serializedState.specialEvent as SpecialEvent;
    solarSystem._difficulty = serializedState.difficulty;
    solarSystem.politics = politicsForType(serializedState.politicsType);

    solarSystem.x = serializedState.x;
    solarSystem.y = serializedState.y;

    solarSystem._inventoryReplenishCountdown = serializedState.inventoryReplenishCountdown;

    solarSystem.visited = serializedState.visited;

    const mercenaryState = serializedState.mercenary;
    if (mercenaryState) {
      solarSystem.mercenary = CrewMember.load(mercenaryState);
      ensureObjectOrNull(solarSystem.mercenary);
    } else {
      solarSystem.mercenary = null;
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
    this.wormhole = SolarSystem.solarSystemForName(wormholeName, solarSystems);
  }

  get inventoryReplenishCountdown() {
    return this._inventoryReplenishCountdown;
  }

  set inventoryReplenishCountdown(i: number) {
    if (ensureInteger(i)) {
      this._inventoryReplenishCountdown = i;
    }
  }

  hashCode() {
    const str = this.name;

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
          Math.abs(item.techLevelMaxProd - this.techLevel)) *
        (1 + this.size);

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
        if (this.status === item.doublePriceStatus) {
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
    return Math.floor(this.squaredDistanceToXY(other.x, other.y));
  }

  squaredDistanceToXY(x: number, y: number) {
    ensureInteger(x);
    ensureInteger(y);
    return Math.floor((this.x - x) ** 2 + (this.y - y) ** 2);
  }

  standardPriceForItem(itemType: number) {
    if (
      (itemType === TradeItemType.Narcotics && !this.politics.drugsTradeable) ||
      (itemType === TradeItemType.Firearms && !this.politics.firearmsTradeable)
    ) {
      return 0;
    }

    const item = tradeItemForType(itemType);

    if (this.techLevel < item.techLevelToUse) {
      return 0;
    }

    let price = item.priceLowTech + Math.floor(this.techLevel * item.priceIncreasePerTechLevel);

    if (this.politics.mostDesiredTradeItem === itemType) {
      price = Math.floor((price * 4) / 3);
    }

    price = Math.floor((price * (100 - 2 * this.politics.occurrenceTraders)) / 100);
    price = Math.floor((price * (100 - this.size)) / 100);

    if (this.visited && this._specialResource !== Resource.None) {
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
      (itemType === TradeItemType.Narcotics && !this.politics.drugsTradeable) ||
      (itemType === TradeItemType.Firearms && !this.politics.firearmsTradeable) ||
      this.techLevel < item.techLevelToProduce;

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
    const hasStatus = this.status !== Status.Uneventful;

    if (runtime.gameRand.randomIntBelow(100) < 15) {
      this.status = hasStatus
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

    ensureType(this.name, 'string');
    state.name = this.name;

    ensureInteger(this.techLevel);
    state.techLevel = this.techLevel;

    ensureInteger(this.status);
    state.status = this.status;

    ensureInteger(this._specialResource);
    state.specialResource = this._specialResource;

    ensureInteger(this.size);
    state.size = this.size;

    ensureInteger(this.specialEvent);
    state.specialEvent = this.specialEvent;

    ensureInteger(this._difficulty);
    state.difficulty = this._difficulty;

    ensureInteger(this.politics.type);
    state.politicsType = this.politics.type;

    ensureInteger(this.x);
    state.x = this.x;
    ensureInteger(this.y);
    state.y = this.y;

    ensureInteger(this._inventoryReplenishCountdown);
    state.inventoryReplenishCountdown = this._inventoryReplenishCountdown;

    ensureBool(this.visited);
    state.visited = this.visited;

    ensureObjectOrNull(this.wormhole);
    if (this.wormhole) {
      ensureType(this.wormhole.name, 'string');
      state.wormholeName = this.wormhole.name;
    }

    ensureObjectOrNull(this.mercenary);
    if (this.mercenary) {
      state.mercenary = this.mercenary.toState();
    }

    ensureArrayOrNull(this._tradeItemInventory, 'number');
    state.tradeItemInventory = this._tradeItemInventory.map(item => item);

    return state;
  }
}
