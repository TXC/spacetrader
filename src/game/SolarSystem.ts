import { CrewMember } from './CrewMember.ts';
import type { CrewMemberState } from './CrewMember.ts';
import { Politics, occurrenceStr } from './Politics.ts';
import { SpecialEvent, SystemSize, SYSTEM_SIZE_STR } from './SolarSystem.types.ts';
import { TradeItem } from './TradeItem.ts';
import {
  RESOURCES_STR,
  Resource,
  Status,
  TechLevel,
  TradeItemType,
  STATUS_STR,
  TECH_LEVEL_STR,
} from './TradeItem.types.ts';
import { Utils } from './Utilities.ts';
import { runtime } from './runtime.ts';

// What serializedState() writes into a saved game.
export type SolarSystemState = {
  name: string;
  techLevel: number;
  status: number;
  specialResource: number;
  size: number;
  specialEvent: number;
  difficulty: number;
  politicsType: number;
  x: number;
  y: number;
  inventoryReplenishCountdown: number;
  visited: boolean;
  wormholeName?: string;
  mercenary?: CrewMemberState;
  tradeItemInventory: number[];
};

export class SolarSystem {
  declare static sSystemNames: string[] | undefined;
  declare _name: string;
  declare _x: number;
  declare _y: number;
  declare _difficulty: number;
  declare _mercenary: CrewMember | null;
  declare _wormhole: SolarSystem | null;
  declare _specialEvent: number;
  declare _visited: boolean;
  declare _techLevel: number;
  declare _politics: Politics;
  declare _specialResource: number;
  declare _size: number;
  declare _status: number;
  declare _inventoryReplenishCountdown: number;
  declare _tradeItemInventory: number[];

  constructor(name?: string, x?: number, y?: number, difficulty?: number) {
    if (!name) {
      return;
    }

    Utils.ensureType(name, 'string');
    this._name = name;

    Utils.ensureArrayOrNull([x, y, difficulty], 'number');
    this._x = x!;
    this._y = y!;
    this._difficulty = difficulty!;

    this._mercenary = null;
    this._wormhole = null;

    this._specialEvent = SpecialEvent.None;
    this._visited = false;

    // Randomize the other properties
    this._techLevel = runtime.gameRand.randomIntBelow(TechLevel.Count);
    this._politics = Politics.randomPoliticsForTechLevel(this._techLevel);

    if (runtime.gameRand.randomIntBelow(5) >= 3) {
      this._specialResource = 1 + runtime.gameRand.randomIntBelow(Resource.Count - 1);
    } else {
      this._specialResource = Resource.None;
    }

    this._size = runtime.gameRand.randomIntBelow(SystemSize.Count);

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
    Utils.ensureArrayOrNull(solarSystems, 'object');

    if (!name) return null;

    for (const solarSystem of solarSystems) {
      if (solarSystem._name === name) {
        return solarSystem;
      }
    }
    return null;
  }

  static fromSerializedState(serializedState: SolarSystemState) {
    const solarSystem = new SolarSystem();
    solarSystem._name = serializedState.name;
    solarSystem._techLevel = serializedState.techLevel;
    solarSystem._status = serializedState.status;
    solarSystem._specialResource = serializedState.specialResource;
    solarSystem._size = serializedState.size;
    solarSystem._specialEvent = serializedState.specialEvent;
    solarSystem._difficulty = serializedState.difficulty;
    solarSystem._politics = Politics.politicsForType(serializedState.politicsType)!;

    solarSystem._x = serializedState.x;
    solarSystem._y = serializedState.y;

    solarSystem._inventoryReplenishCountdown = serializedState.inventoryReplenishCountdown;

    solarSystem._visited = serializedState.visited;

    const mercenaryState = serializedState.mercenary;
    if (mercenaryState) {
      solarSystem._mercenary = CrewMember.fromSerializedState(mercenaryState);
      Utils.ensureObjectOrNull(solarSystem._mercenary);
    } else {
      solarSystem._mercenary = null;
    }

    const tradeItemInventoryArray = serializedState.tradeItemInventory;
    solarSystem._tradeItemInventory = Array(TradeItemType.Count).fill(0);
    for (let tradeItemType = 0; tradeItemType < TradeItemType.Count; ++tradeItemType) {
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

  set techLevel(t: number) {
    if (Utils.ensureInteger(t)) {
      this._techLevel = t;
    }
  }

  setVisited(v: boolean) {
    if (Utils.ensureBool(v)) {
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
    if (Utils.ensureInteger(i)) {
      this._inventoryReplenishCountdown = i;
    }
  }

  setWormhole(sys: SolarSystem) {
    if (Utils.ensureType(sys, 'object')) {
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

  setSpecialEvent(sE: number) {
    if (Utils.ensureInteger(sE)) {
      this._specialEvent = sE;
    }
  }

  getSpecialEvent() {
    return this._specialEvent;
  }

  get specialEvent() {
    return this._specialEvent;
  }

  set specialEvent(sE: number) {
    this.setSpecialEvent(sE);
  }

  setMercenary(m: CrewMember) {
    if (Utils.ensureType(m, 'object')) {
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
    if (Utils.ensureInteger(p.type)) {
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
    this._tradeItemInventory = Array(TradeItemType.Count).fill(0);
    for (let itemType = 0; itemType < TradeItemType.Count; ++itemType) {
      const item = TradeItem.tradeItemForType(itemType)!;

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

      Utils.ensureInteger(this._tradeItemInventory[itemType]);
    }
  }

  distanceTo(other: SolarSystem) {
    return Math.floor(Math.sqrt(this.squaredDistanceTo(other)));
  }

  squaredDistanceTo(other: SolarSystem) {
    return Math.floor(this.squaredDistanceToXY(other._x, other._y));
  }

  squaredDistanceToXY(x: number, y: number) {
    Utils.ensureInteger(x);
    Utils.ensureInteger(y);
    return Math.floor((this._x - x) ** 2 + (this._y - y) ** 2);
  }

  standardPriceForItem(itemType: number) {
    if (
      (itemType === TradeItemType.Narcotics && !this._politics.drugsTradeable) ||
      (itemType === TradeItemType.Firearms && !this._politics.firearmsTradeable)
    ) {
      return 0;
    }

    const item = TradeItem.tradeItemForType(itemType)!;

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

    Utils.ensureInteger(price);

    return Math.max(price, 0);
  }

  tradeItemQuantityForType(type: number) {
    //console.assert(type >= 0 && type < TradeItemType.Count);
    Utils.ensureInteger(type);
    return this._tradeItemInventory[type];
  }

  boughtQuantity(quantity: number, type: number) {
    //console.assert(type >= 0 && type < TradeItemType.Count);
    if (Utils.ensureInteger(quantity) && Utils.ensureInteger(type)) {
      this._tradeItemInventory[type] -= Math.min(quantity, this._tradeItemInventory[type]);
    }
  }

  _canProduceItem(itemType: number) {
    const item = TradeItem.tradeItemForType(itemType)!;

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
        for (let itemType = 0; itemType < TradeItemType.Count; ++itemType) {
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
      for (let itemType = 0; itemType < TradeItemType.Count; ++itemType) {
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
        : 1 + runtime.gameRand.randomIntBelow(Status.Count - 1);
    }
  }

  systemInfoString() {
    const systemInfo = `${SYSTEM_SIZE_STR(this.size).toLowerCase()} ${TECH_LEVEL_STR(this.techLevel).toLowerCase()} ${this.politics.name.toLowerCase()}\n${STATUS_STR(this.status).toLowerCase()}\n${RESOURCES_STR(this._specialResource).toLowerCase()}, ${occurrenceStr(this.politics.occurrencePolice).toLowerCase()} police, ${occurrenceStr(this.politics.occurrencePirates).toLowerCase()} pirates`;
    return systemInfo;
  }

  serializedState() {
    // Filled in field by field below.
    const state = {} as SolarSystemState;

    Utils.ensureType(this._name, 'string');
    state.name = this._name;

    Utils.ensureInteger(this._techLevel);
    state.techLevel = this._techLevel;

    Utils.ensureInteger(this._status);
    state.status = this._status;

    Utils.ensureInteger(this._specialResource);
    state.specialResource = this._specialResource;

    Utils.ensureInteger(this._size);
    state.size = this._size;

    Utils.ensureInteger(this._specialEvent);
    state.specialEvent = this._specialEvent;

    Utils.ensureInteger(this._difficulty);
    state.difficulty = this._difficulty;

    Utils.ensureInteger(this._politics.type);
    state.politicsType = this._politics.type;

    Utils.ensureInteger(this._x);
    state.x = this._x;
    Utils.ensureInteger(this._y);
    state.y = this._y;

    Utils.ensureInteger(this._inventoryReplenishCountdown);
    state.inventoryReplenishCountdown = this._inventoryReplenishCountdown;

    Utils.ensureBool(this._visited);
    state.visited = this._visited;

    Utils.ensureObjectOrNull(this._wormhole);
    if (this._wormhole) {
      Utils.ensureType(this._wormhole.name, 'string');
      state.wormholeName = this._wormhole.name;
    }

    Utils.ensureObjectOrNull(this._mercenary);
    if (this._mercenary) {
      state.mercenary = this._mercenary.serializedState();
    }

    Utils.ensureArrayOrNull(this._tradeItemInventory, 'number');
    state.tradeItemInventory = this._tradeItemInventory.map(item => item);

    return state;
  }
}
