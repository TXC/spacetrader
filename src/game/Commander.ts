import { accessoryForType } from './Accessory.ts';
import type { AccessoryType } from './Accessory.ts';
import { CrewMember } from './CrewMember.ts';
import type { CrewMemberFields } from './CrewMember.ts';
import { Ship } from './Ship.ts';
import type { ShipModel } from './Ship.ts';
import { SolarSystem } from './SolarSystem.ts';
import { MOON_PRICE, Difficulty } from './SolarSystem.types.ts';
import { tradeItemForType } from './TradeItem.ts';
import { Status, TRADE_ITEM_COUNT, TRADE_ITEM_TYPES } from './TradeItem.types.ts';
import type { TradeItemType } from './TradeItem.types.ts';
import { ensureArrayOrNull, ensureBool, ensureInteger, ensureType } from './ensure.ts';
import { runtime } from './runtime.ts';

export const MAX_SAFE_PILOT_INSURANCE_DISCOUNT = 90;
export const MAX_SKILL_LEVEL = 10;

export const CAUGHT_WITH_WILD_SCORE = -4;
export const PLUNDER_PIRATE_SCORE = -1;
export const PLUNDER_TRADER_SCORE = -2;
export const ATTACK_POLICE_SCORE = -3;
export const ATTACK_TRADER_SCORE = -2;
export const KILL_POLICE_SCORE = -6;
export const KILL_PIRATE_SCORE = 1;
export const KILL_TRADER_SCORE = -4;
export const FLEE_FROM_INSPECTION_SCORE = -2;
export const TRAFFICKING_SCORE = -1;

export const PoliceRecordScore = {
  Psycho: -100,
  Villain: -70,
  Criminal: -30,
  Crook: -10,
  Dubious: -5,
  Clean: 0,
  Lawful: 5,
  Trusted: 10,
  Liked: 25,
  Hero: 75,
} as const;
export type PoliceRecordScore = (typeof PoliceRecordScore)[keyof typeof PoliceRecordScore];

export function policeRecordName(x: number) {
  if (x <= PoliceRecordScore.Psycho) {
    return 'Psycho';
  } else if (x <= PoliceRecordScore.Villain) {
    return 'Villain';
  } else if (x <= PoliceRecordScore.Criminal) {
    return 'Criminal';
  } else if (x <= PoliceRecordScore.Crook) {
    return 'Crook';
  } else if (x <= PoliceRecordScore.Dubious) {
    return 'Dubious';
  } else if (x >= PoliceRecordScore.Hero) {
    return 'Hero';
  } else if (x >= PoliceRecordScore.Liked) {
    return 'Liked';
  } else if (x >= PoliceRecordScore.Trusted) {
    return 'Trusted';
  } else if (x >= PoliceRecordScore.Lawful) {
    return 'Lawful';
  } else {
    return 'Clean';
  }
}

export function policeRecordMultiplier(x: number) {
  if (x < PoliceRecordScore.Psycho) {
    return 3;
  } else if (x < PoliceRecordScore.Villain) {
    return 2;
  } else {
    return 1;
  }
}

export const ReputationScore = {
  Harmless: 0,
  MostlyHarmless: 10,
  Poor: 20,
  Average: 40,
  AboveAverage: 80,
  Competent: 150,
  Dangerous: 300,
  Deadly: 600,
  Elite: 1500,
} as const;
export type ReputationScore = (typeof ReputationScore)[keyof typeof ReputationScore];

export const DEFAULT_REPUTATION_SCORE = ReputationScore.Harmless;

export function reputationName(x: number) {
  if (x >= ReputationScore.Elite) {
    return 'Elite';
  } else if (x >= ReputationScore.Deadly) {
    return 'Deadly';
  } else if (x >= ReputationScore.Dangerous) {
    return 'Dangerous';
  } else if (x >= ReputationScore.Competent) {
    return 'Competent';
  } else if (x >= ReputationScore.AboveAverage) {
    return 'Above Average';
  } else if (x >= ReputationScore.Average) {
    return 'Average';
  } else if (x >= ReputationScore.Poor) {
    return 'Poor';
  } else if (x >= ReputationScore.MostlyHarmless) {
    return 'Mostly Harmless';
  } else {
    return 'Harmless';
  }
}

import type { CommanderState } from './savedGame.ts';
export type { CommanderState };

// What the player chose for a new commander: a name and four skills.
export type Recruit = {
  name: string;
  engineer: number;
  pilot: number;
  fighter: number;
  trader: number;
};

// How a new commander starts: the money, the ship, and the first system.
type Start = { credits: number; ship: Ship; system: SolarSystem };

// Everything a commander is made of.
type CommanderFields = CrewMemberFields & {
  basePrices: number[] | null;
  days: number;
  noClaim: number;
  policeKills: number;
  traderKills: number;
  pirateKills: number;
  policeRecordScore: number;
  debt: number;
  reputationScore: number;
  travelClicksRemaining: number;
  arrivedViaWormhole: boolean;
  artifactOnBoard: boolean;
  litterWarning: boolean;
  inspected: boolean;
  raided: boolean;
  boughtMoon: boolean;
  hasEscapePod: boolean;
  hasInsurance: boolean;
  credits: number;
  reserveMoney: boolean;
  currentSystem: SolarSystem;
  ship: Ship;
};

export class Commander extends CrewMember {
  private _basePrices: number[] | null;
  days: number;
  private _noClaim: number;
  policeKills: number;
  traderKills: number;
  pirateKills: number;
  policeRecordScore: number;
  private _debt: number;
  private _reputationScore: number;
  private _travelClicksRemaining: number;
  arrivedViaWormhole: boolean;
  artifactOnBoard: boolean;
  litterWarning: boolean;
  inspected: boolean;
  raided: boolean;
  boughtMoon: boolean;
  hasEscapePod: boolean;
  hasInsurance: boolean;
  private _credits: number;
  reserveMoney: boolean;
  private _currentSystem: SolarSystem;
  ship: Ship;

  private constructor(fields: CommanderFields) {
    super(fields);
    this._basePrices = fields.basePrices;
    this.days = fields.days;
    this._noClaim = fields.noClaim;
    this.policeKills = fields.policeKills;
    this.traderKills = fields.traderKills;
    this.pirateKills = fields.pirateKills;
    this.policeRecordScore = fields.policeRecordScore;
    this._debt = fields.debt;
    this._reputationScore = fields.reputationScore;
    this._travelClicksRemaining = fields.travelClicksRemaining;
    this.arrivedViaWormhole = fields.arrivedViaWormhole;
    this.artifactOnBoard = fields.artifactOnBoard;
    this.litterWarning = fields.litterWarning;
    this.inspected = fields.inspected;
    this.raided = fields.raided;
    this.boughtMoon = fields.boughtMoon;
    this.hasEscapePod = fields.hasEscapePod;
    this.hasInsurance = fields.hasInsurance;
    this._credits = fields.credits;
    this.reserveMoney = fields.reserveMoney;
    this._currentSystem = fields.currentSystem;
    this.ship = fields.ship;
  }

  // A new commander, arriving at their first system, whose prices are drawn. Not called
  // `create`: a subclass's static methods must accept what its base class's accept.
  static enlist(recruit: Recruit, start: Start): Commander {
    const { name, engineer, pilot, fighter, trader } = recruit;
    const commander = new Commander({
      ...CrewMember.newFields(name, engineer, pilot, fighter, trader),
      basePrices: null,
      days: 0,
      noClaim: 0,
      policeKills: 0,
      traderKills: 0,
      pirateKills: 0,
      policeRecordScore: 0,
      debt: 0,
      reputationScore: DEFAULT_REPUTATION_SCORE,
      travelClicksRemaining: 0,
      arrivedViaWormhole: false,
      artifactOnBoard: false,
      litterWarning: false,
      inspected: false,
      raided: false,
      boughtMoon: false,
      hasEscapePod: false,
      hasInsurance: false,
      credits: start.credits,
      reserveMoney: false,
      currentSystem: start.system,
      ship: start.ship,
    });
    commander.arrive();
    return commander;
  }

  // A commander from a saved game, as parseSavedGame checked it, at one of its systems.
  static restore(state: CommanderState, solarSystems: SolarSystem[]): Commander {
    const currentSystem = SolarSystem.solarSystemForName(state.currentSystemName, solarSystems)!;
    ensureType(currentSystem, 'object');
    return new Commander({
      ...CrewMember.savedFields(state),
      days: state.days,
      noClaim: state.noClaim,
      policeKills: state.policeKills,
      traderKills: state.traderKills,
      pirateKills: state.pirateKills,
      policeRecordScore: state.policeRecordScore,
      debt: state.debt,
      reputationScore: state.reputationScore,
      travelClicksRemaining: state.travelClicksRemaining,
      arrivedViaWormhole: state.arrivedViaWormhole,
      artifactOnBoard: state.artifactOnBoard,
      litterWarning: state.litterWarning,
      inspected: state.inspected,
      raided: state.raided,
      boughtMoon: state.boughtMoon,
      hasEscapePod: state.hasEscapePod,
      hasInsurance: state.hasInsurance,
      credits: state.credits,
      reserveMoney: state.reserveMoney,
      currentSystem,
      ship: Ship.load(state.ship, solarSystems),
      basePrices: state.basePrices ? [...state.basePrices] : null,
    });
  }

  _hasDubiousPoliceRecord() {
    return this.policeRecordScore <= PoliceRecordScore.Dubious;
  }

  _checkCreditsAmount(c: number) {
    return ensureInteger(c);
  }

  get credits() {
    return this._credits;
  }

  set credits(c: number) {
    if (this._checkCreditsAmount(c)) {
      this._credits = c;
    }
  }

  get noClaim() {
    return this._noClaim;
  }

  set noClaim(n) {
    if (ensureInteger(n)) {
      this._noClaim = n;
    }
  }

  get reputationScore() {
    return this._reputationScore;
  }

  set reputationScore(r) {
    if (ensureInteger(r)) {
      this._reputationScore = r;
    }
  }

  get debt() {
    return this._debt;
  }

  set debt(d: number) {
    if (this._checkCreditsAmount(d)) {
      this._debt = d;
    }
  }

  get travelClicksRemaining() {
    return this._travelClicksRemaining;
  }

  set travelClicksRemaining(t) {
    if (ensureInteger(t)) {
      this._travelClicksRemaining = t;
    }
  }

  moveTo(currentSystem: SolarSystem) {
    ensureType(currentSystem, 'object');

    if (this._currentSystem !== currentSystem) {
      this._currentSystem = currentSystem;
      this.arrive();
    }
  }

  // The system is visited before its prices are drawn: a visited system's special
  // resource changes them.
  private arrive() {
    this._currentSystem.visited = true;

    const basePrices = [];
    for (const item of TRADE_ITEM_TYPES) {
      basePrices.push(this._calculateBasePriceForItem(item));
    }
    this._basePrices = basePrices;
  }

  get currentSystem() {
    return this._currentSystem;
  }

  _calculateBasePriceForItem(itemType: TradeItemType) {
    let price = this._currentSystem.standardPriceForItem(itemType);
    if (price <= 0) return 0;

    const item = tradeItemForType(itemType);
    if (
      item.doublePriceStatus !== Status.Uneventful &&
      this._currentSystem.status === item.doublePriceStatus
    ) {
      // DoublePriceStatus is a misleading name
      price = Math.floor((price * 3) / 2);
    }

    // Two separate draws, in this order: the price moves up by one and down by the other.
    const up = runtime.gameRand.randomIntBelow(item.priceVariance);
    const down = runtime.gameRand.randomIntBelow(item.priceVariance);
    price += up - down;

    ensureInteger(price);

    return Math.max(price, 0);
  }

  sellPriceForItem(itemType: number) {
    const validState =
      ensureArrayOrNull(this._basePrices, 'number') && ensureType(this._basePrices, 'object');

    if (!validState) {
      return 0;
    }

    let price = this._basePrices![itemType];
    if (price <= 0) return 0;
    if (this._hasDubiousPoliceRecord()) {
      // We need to pay off a middleman
      price = Math.floor((price * 90) / 100);
    }

    ensureInteger(price);

    return price;
  }

  buyPriceForItem(itemType: number, difficulty: Difficulty) {
    let price = this._basePrices![itemType];
    if (price <= 0) return 0;
    price = Math.floor(
      (price *
        (103 + (MAX_SKILL_LEVEL - this.ship.crewTraderSkillIncludingCommander(this, difficulty)))) /
        100
    );
    price = Math.max(price, this.sellPriceForItem(itemType) + 1);

    ensureInteger(price);

    return price;
  }

  buyPriceForAccessory(accessoryType: AccessoryType, difficulty: Difficulty) {
    const accessory = accessoryForType(accessoryType)!;
    const price =
      accessory.techLevel > this._currentSystem.techLevel
        ? 0
        : Math.floor(
            (accessory.price *
              (100 - this.ship.crewTraderSkillIncludingCommander(this, difficulty))) /
              100
          );

    ensureInteger(price);

    return price;
  }

  sellPriceForAccessory(accessoryType: AccessoryType) {
    const result = Math.floor((accessoryForType(accessoryType)!.price * 3) / 4);
    ensureInteger(result);
    return result;
  }

  buyPriceForShipModel(shipModel: ShipModel, difficulty: Difficulty) {
    const result = Math.floor(
      (shipModel.price * (100 - this.ship.crewTraderSkillIncludingCommander(this, difficulty))) /
        100
    );
    ensureInteger(result);
    return result;
  }

  debtIsTooLargeToBuy() {
    return this.debt > 100000;
  }

  spendingMoney() {
    const result = this.reserveMoney
      ? Math.max(0, this._credits - this.ship.mercenaryPricePerDay() - this.currentInsuranceCost())
      : this._credits;
    ensureInteger(result);
    return result;
  }

  currentInsuranceCost() {
    return this.hasInsurance ? this.insurancePrice() : 0;
  }

  insurancePrice() {
    const result = Math.max(
      1,
      Math.floor(
        (Math.floor((this.ship.shipValuationForInsurance(true) * 5) / 2000) *
          (100 - Math.min(this._noClaim, MAX_SAFE_PILOT_INSURANCE_DISCOUNT))) /
          100
      )
    );
    ensureInteger(result);
    return result;
  }

  netWorth() {
    const result =
      this.cargoAndShipValuationForInsurance(false) +
      this._credits -
      this.debt +
      (this.boughtMoon ? MOON_PRICE : 0);
    ensureInteger(result);
    return result;
  }

  maxLoan() {
    const result =
      this.policeRecordScore >= PoliceRecordScore.Clean
        ? Math.min(25000, Math.max(1000, Math.floor(this.netWorth() / 10 / 500) * 500))
        : 500;
    ensureInteger(result);
    return result;
  }

  _cargoValue() {
    let value = 0;
    for (let item = 0; item < TRADE_ITEM_COUNT; ++item) {
      const quantity = this.ship.tradeItemQuantityForType(item);
      value += quantity * this.sellPriceForItem(item);
    }

    ensureInteger(value);

    return value;
  }

  cargoAndShipValuationForInsurance(forInsurance: boolean) {
    const result = this.ship.shipValuationForInsurance(forInsurance) + this._cargoValue();
    ensureInteger(result);
    return result;
  }

  attemptPurchaseOfFuel(amount: number) {
    if (ensureInteger(amount)) {
      let realAmount = Math.min(this.ship.fuelTankCapacity() - this.ship.fuel, amount);
      realAmount = Math.min(realAmount, Math.floor(this._credits / this.ship.model.costOfFuel));
      this.ship.fillFuelByAmount(realAmount);
      this.credits -= realAmount * this.ship.model.costOfFuel;
    }
  }

  attemptPurchaseOfRepairs(amount: number) {
    if (ensureInteger(amount)) {
      let realAmount = Math.min(this.ship.maximumHullStrength() - this.ship.hull, amount);
      realAmount = Math.floor(Math.min(realAmount, this._credits / this.ship.model.repairCosts));
      this.ship.repairHullByAmount(realAmount);
      this.credits -= realAmount * this.ship.model.repairCosts;
    }
  }

  attemptPurchaseOfItem(itemType: TradeItemType, quantity: number, difficulty: Difficulty) {
    if (ensureInteger(itemType) && ensureInteger(quantity)) {
      let actualBuyAmount = Math.min(
        quantity,
        this._currentSystem.tradeItemQuantityForType(itemType)
      );
      actualBuyAmount = Math.min(actualBuyAmount, this.ship.freeCargoBays());
      const buyPrice = this.buyPriceForItem(itemType, difficulty);
      if (buyPrice > 0) {
        actualBuyAmount = Math.min(actualBuyAmount, Math.floor(this.spendingMoney() / buyPrice));
      } else {
        actualBuyAmount = 0;
      }

      this.ship.boughtQuantity(
        actualBuyAmount,
        itemType,
        this.buyPriceForItem(itemType, difficulty)
      );
      this.credits -= actualBuyAmount * this.buyPriceForItem(itemType, difficulty);
      this._currentSystem.boughtQuantity(actualBuyAmount, itemType);
    }
  }

  attemptSaleOfItem(
    itemType: number,
    quantity: number,
    forceDump: boolean,
    difficulty: Difficulty
  ) {
    if (ensureInteger(itemType) && ensureInteger(quantity) && ensureBool(forceDump)) {
      let actualSellAmount = Math.min(quantity, this.ship.tradeItemQuantityForType(itemType));

      const isDumping = forceDump || this.sellPriceForItem(itemType) === 0;
      const dumpPenalty = 5 * (difficulty + 1);
      if (isDumping) {
        actualSellAmount = Math.min(
          actualSellAmount,
          Math.floor(this.spendingMoney() / dumpPenalty)
        );
      }

      this.ship.soldQuantity(actualSellAmount, itemType);

      if (isDumping) {
        this.credits -= actualSellAmount * dumpPenalty;
      } else {
        this.credits += actualSellAmount * this.sellPriceForItem(itemType);
      }
    }
  }

  wormholeTaxToWarpToSystem(destination: SolarSystem) {
    ensureType(destination, 'object');
    return this._currentSystem.wormhole === destination ? this.ship.model.costOfFuel * 25 : 0;
  }

  increaseSkillRandomly() {
    return this._tweakSkillRandomly(true);
  }

  decreaseSkillRandomly() {
    this._tweakSkillRandomly(false);
  }

  // The name of the skill that changed, or null when none of them could.
  _tweakSkillRandomly(increase: boolean) {
    ensureBool(increase);

    const canChange = (x: number) => (increase ? x < MAX_SKILL_LEVEL : x > 0);
    const skills = (['pilot', 'fighter', 'trader', 'engineer'] as const).filter(skill =>
      canChange(this[skill])
    );
    if (skills.length === 0) return null;

    const skill = skills[runtime.gameRand.randomIntBelow(skills.length)];
    this[skill] += increase ? 1 : -1;
    return skill;
  }

  payInterest() {
    if (this.debt > 0) {
      const debtIncrease = Math.max(1, Math.floor(this.debt / 10));
      ensureInteger(debtIncrease);
      if (this.credits > debtIncrease) {
        this.credits -= debtIncrease;
      } else {
        this.debt += debtIncrease - this.credits;
        this.credits = 0;
      }
    }
  }

  timePassed(days: number, difficulty: Difficulty) {
    if (!ensureInteger(days)) {
      return;
    }

    this.days += days;
    if (this.hasInsurance) {
      this._noClaim += days;
    }

    if (this.policeRecordScore > PoliceRecordScore.Clean) {
      if (this.days % 3 === 0) {
        this.policeRecordScore--;
      }
    } else if (this.policeRecordScore < PoliceRecordScore.Dubious) {
      if (difficulty <= Difficulty.Normal || this.days % difficulty === 0) {
        this.policeRecordScore++;
      }
    }
  }

  override toState() {
    // The commander's own fields are added below.
    const state = super.toState() as CommanderState;

    // Integer properties
    ensureInteger(this._credits);
    state.credits = this._credits;

    ensureInteger(this._debt);
    state.debt = this._debt;

    ensureInteger(this.days);
    state.days = this.days;

    ensureInteger(this.policeKills);
    state.policeKills = this.policeKills;

    ensureInteger(this.traderKills);
    state.traderKills = this.traderKills;

    ensureInteger(this.pirateKills);
    state.pirateKills = this.pirateKills;

    ensureInteger(this.policeRecordScore);
    state.policeRecordScore = this.policeRecordScore;

    ensureInteger(this._reputationScore);
    state.reputationScore = this._reputationScore;

    ensureInteger(this._noClaim);
    state.noClaim = this._noClaim;

    ensureInteger(this._travelClicksRemaining);
    state.travelClicksRemaining = this._travelClicksRemaining;

    // Boolean properties
    ensureBool(this.boughtMoon);
    state.boughtMoon = this.boughtMoon;

    ensureBool(this.hasEscapePod);
    state.hasEscapePod = this.hasEscapePod;

    ensureBool(this.hasInsurance);
    state.hasInsurance = this.hasInsurance;

    ensureBool(this.raided);
    state.raided = this.raided;

    ensureBool(this.inspected);
    state.inspected = this.inspected;

    ensureBool(this.litterWarning);
    state.litterWarning = this.litterWarning;

    ensureBool(this.artifactOnBoard);
    state.artifactOnBoard = this.artifactOnBoard;

    ensureBool(this.arrivedViaWormhole);
    state.arrivedViaWormhole = this.arrivedViaWormhole;

    ensureBool(this.reserveMoney);
    state.reserveMoney = this.reserveMoney;

    // Current system and ship
    ensureType(this._currentSystem.name, 'string');
    state.currentSystemName = this._currentSystem.name;

    state.ship = this.ship.toState();

    // Base prices
    ensureArrayOrNull(this._basePrices, 'number');
    if (this._basePrices) {
      state.basePrices = [...this._basePrices];
    }

    return state;
  }
}
